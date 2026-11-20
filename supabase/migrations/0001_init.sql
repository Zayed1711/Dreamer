-- Dreamer: initial schema for Supabase (Postgres 15+).
-- Journey content lives in content/journeys and is versioned in git. The database
-- stores each student's generated journey and their task completions; progress
-- (EXP, rank, plane position) is computed from those by @dreamer/journey-engine.

create extension if not exists pgcrypto;

-- ---------- Types ----------

create type user_role as enum ('student', 'advisor', 'admin');
create type stage as enum ('hsc1', 'hsc2', 'after_hsc', 'ug1', 'ug2', 'ug3', 'ug4', 'graduated');
create type degree as enum ('bachelors', 'masters');
create type english_level as enum ('beginner', 'intermediate', 'advanced');
create type season as enum ('fall', 'spring');
create type advisor_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type session_status as enum ('scheduled', 'cancelled', 'done');
create type booking_status as enum ('pending_payment', 'confirmed', 'cancelled', 'refunded');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type payout_status as enum ('due', 'paid');
create type advertiser_type as enum ('agency', 'ielts_provider', 'english_course', 'other');
create type advertiser_status as enum ('active', 'suspended', 'removed');
create type ad_event_type as enum ('view', 'click');
create type report_status as enum ('open', 'reviewing', 'closed');

-- ---------- Profiles ----------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role user_role not null default 'student',
  birth_year int check (birth_year between 1950 and 2020),
  stage stage,
  degree degree,
  english_level english_level,
  countries text[] not null default '{}',
  division text,
  hsc_exam_year int,
  graduation_year int,
  graduation_month int check (graduation_month between 1 and 12),
  intake_year int,
  intake_season season,
  language text not null default 'bn' check (language in ('bn', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Users may edit their own profile, but never their own role.
create or replace function guard_profile_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Only an admin can change a role';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_guard before update on profiles
  for each row execute function guard_profile_role();

-- Create a profile row when a user signs up.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Journeys and progress ----------

create table journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  template_key text not null,
  content_version int not null default 1,
  generated_for text not null,               -- "YYYY-MM"
  data jsonb not null,                        -- the Journey object from the engine
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index journeys_one_active on journeys (user_id) where active;

-- Completion is stored per task ("milestone.task"), so it survives regenerating
-- a journey or switching template (J2 -> J3).
create table task_completions (
  user_id uuid not null references profiles (id) on delete cascade,
  task_id text not null check (task_id ~ '^[a-z0-9_]+\.[a-z0-9_]+$'),
  completed_at timestamptz not null default now(),
  evidence_path text,                         -- optional proof for big milestones (storage path)
  primary key (user_id, task_id)
);

-- Weekly journey streak and daily English streak.
create table streaks (
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null check (kind in ('weekly_journey', 'daily_english')),
  current_count int not null default 0,
  best_count int not null default 0,
  last_period date,
  freezes_left int not null default 2,
  primary key (user_id, kind)
);

-- ---------- Advisors (Mentors) ----------

create table advisors (
  user_id uuid primary key references profiles (id) on delete cascade,
  university text not null,
  country text not null,                      -- ISO 3166-1 alpha-2
  subject text not null,
  intake_year int not null,
  bio text not null default '',
  photo_path text,
  status advisor_status not null default 'pending',
  proof_path text,                            -- private storage; deleted after verification
  verified_at timestamptz,
  proof_deleted_at timestamptz,
  revenue_share numeric(3, 2) not null default 0.70 check (revenue_share between 0 and 1),
  created_at timestamptz not null default now()
);

create or replace function guard_advisor_status() returns trigger
language plpgsql as $$
begin
  if (new.status is distinct from old.status
      or new.revenue_share is distinct from old.revenue_share
      or new.verified_at is distinct from old.verified_at)
     and not is_admin() then
    raise exception 'Only an admin can verify advisors or change their share';
  end if;
  return new;
end;
$$;
create trigger advisors_guard before update on advisors
  for each row execute function guard_advisor_status();

create table advisor_sessions (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references advisors (user_id) on delete cascade,
  title text not null,
  topic text,                                 -- matches milestone advisorTopic, e.g. 'sop-review'
  starts_at timestamptz not null,
  duration_min int not null default 60 check (duration_min between 30 and 180),
  capacity int not null default 25 check (capacity between 1 and 25),
  price_bdt int not null check (price_bdt >= 0),
  meet_url text,
  status session_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references advisor_sessions (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  status booking_status not null default 'pending_payment',
  created_at timestamptz not null default now(),
  unique (session_id, student_id)
);

-- Seat limit: no more bookings than the session's capacity.
create or replace function enforce_capacity() returns trigger
language plpgsql as $$
declare
  taken int;
  cap int;
begin
  select capacity into cap from advisor_sessions where id = new.session_id for update;
  select count(*) into taken from bookings
    where session_id = new.session_id
      and status in ('pending_payment', 'confirmed')
      and id <> new.id;
  if taken >= cap then
    raise exception 'This session is full';
  end if;
  return new;
end;
$$;
create trigger bookings_capacity before insert on bookings
  for each row execute function enforce_capacity();

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete restrict,
  provider text not null check (provider in ('bkash', 'nagad', 'sslcommerz')),
  provider_ref text,
  amount_bdt int not null check (amount_bdt >= 0),
  status payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references advisors (user_id) on delete restrict,
  period_start date not null,
  period_end date not null,
  amount_bdt int not null check (amount_bdt >= 0),
  status payout_status not null default 'due',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Advertisers and ads ----------

create table advertisers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type advertiser_type not null,
  standards_accepted_at timestamptz,          -- shown as "meets our standards as of <date>"
  status advertiser_status not null default 'active',
  contact text,
  created_at timestamptz not null default now()
);

create table ads (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references advertisers (id) on delete cascade,
  slot text not null,                         -- matches milestone slot, e.g. 'ielts_coaching', 'agency'
  headline text not null,
  body text not null default '',
  link_url text not null,
  image_path text,
  referral_code text not null,
  target_stages stage[] not null default '{}',          -- empty = all
  target_countries text[] not null default '{}',        -- empty = all
  target_english english_level[] not null default '{}', -- empty = all
  starts_on date not null,
  ends_on date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index ads_slot_active on ads (slot) where active;

-- Ad events carry no user id, so advertisers' reports never identify a student.
create table ad_events (
  id bigint generated always as identity primary key,
  ad_id uuid not null references ads (id) on delete cascade,
  event ad_event_type not null,
  milestone_key text,
  stage stage,
  created_at timestamptz not null default now()
);
create index ad_events_ad_time on ad_events (ad_id, created_at);

-- ---------- Scam check and reports ----------

create table scam_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete set null,
  answers jsonb not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  target_type text not null check (target_type in ('advisor', 'advertiser')),
  target_id uuid not null,
  body text not null,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

-- ---------- Row-level security ----------

alter table profiles enable row level security;
alter table journeys enable row level security;
alter table task_completions enable row level security;
alter table streaks enable row level security;
alter table advisors enable row level security;
alter table advisor_sessions enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table payouts enable row level security;
alter table advertisers enable row level security;
alter table ads enable row level security;
alter table ad_events enable row level security;
alter table scam_checks enable row level security;
alter table reports enable row level security;

-- Profiles: your own, or everything for admins.
create policy profiles_own on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update using (id = auth.uid() or is_admin());

-- Journeys, completions, streaks: your own only (admins can read for support).
create policy journeys_own on journeys for all
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy completions_own on task_completions for all
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy streaks_own on streaks for all
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

-- Advisors: approved ones are public to signed-in users; you manage your own application.
create policy advisors_read on advisors for select
  using (status = 'approved' or user_id = auth.uid() or is_admin());
create policy advisors_apply on advisors for insert
  with check (user_id = auth.uid() and status = 'pending');
create policy advisors_update on advisors for update
  using (user_id = auth.uid() or is_admin());

-- Sessions: visible when the advisor is approved; advisors manage their own.
create policy sessions_read on advisor_sessions for select using (
  exists (select 1 from advisors a where a.user_id = advisor_id and a.status = 'approved')
  or advisor_id = auth.uid() or is_admin()
);
create policy sessions_write on advisor_sessions for all
  using (advisor_id = auth.uid() or is_admin())
  with check (
    (advisor_id = auth.uid()
      and exists (select 1 from advisors a where a.user_id = auth.uid() and a.status = 'approved'))
    or is_admin()
  );

-- Bookings: students see their own; advisors see bookings for their sessions.
create policy bookings_read on bookings for select using (
  student_id = auth.uid()
  or exists (select 1 from advisor_sessions s where s.id = session_id and s.advisor_id = auth.uid())
  or is_admin()
);
create policy bookings_create on bookings for insert
  with check (student_id = auth.uid() and status = 'pending_payment');
-- Status changes (confirmed, refunded) happen server-side with the service role.

-- Payments: read your own; written only by the server (service role bypasses RLS).
create policy payments_read on payments for select using (
  exists (select 1 from bookings b where b.id = booking_id and b.student_id = auth.uid())
  or is_admin()
);

create policy payouts_read on payouts for select using (advisor_id = auth.uid() or is_admin());
create policy payouts_admin on payouts for all using (is_admin()) with check (is_admin());

-- Advertisers and ads: active ones are public; only admins write.
create policy advertisers_read on advertisers for select using (status = 'active' or is_admin());
create policy advertisers_admin on advertisers for all using (is_admin()) with check (is_admin());
create policy ads_read on ads for select using (
  (active and current_date between starts_on and ends_on) or is_admin()
);
create policy ads_admin on ads for all using (is_admin()) with check (is_admin());

-- Ad events: anyone may record one; only admins read them.
create policy ad_events_insert on ad_events for insert with check (true);
create policy ad_events_read on ad_events for select using (is_admin());

create policy scam_checks_own on scam_checks for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or user_id is null);

create policy reports_own on reports for select using (reporter_id = auth.uid() or is_admin());
create policy reports_create on reports for insert with check (reporter_id = auth.uid());
create policy reports_admin on reports for update using (is_admin());
