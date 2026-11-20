-- Dreamer: daily quests, activity days, and freeze tracking
-- Phase 2 migration: adds submissions, daily activity log, and freeze refill dates.

-- ---------- Daily Quest Submissions ----------

create table daily_quest_submissions (
  user_id uuid not null references profiles (id) on delete cascade,
  quest_date date not null,
  track text not null default 'english',
  quest_type text not null,
  payload jsonb not null default '{}'::jsonb,
  passed boolean not null default true,
  exp int not null default 20 check (exp >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, quest_date, track)
);

-- ---------- Activity Days ----------

-- Recorded whenever a task is ticked or a quest is passed.
-- Drives the weekly streak in Phase 3 and survives unticking tasks.
create table activity_days (
  user_id uuid not null references profiles (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ---------- Streaks Refill Date ----------

-- Refilled to 2 every 4 months (one academic term).
alter table streaks add column if not exists freezes_reset_at date not null default current_date;

-- ---------- Row-Level Security ----------

alter table daily_quest_submissions enable row level security;
alter table activity_days enable row level security;

-- Submissions: own rows only, admins can read for support.
create policy daily_quests_own on daily_quest_submissions for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

-- Activity days: own rows only, admins can read.
create policy activity_days_own on activity_days for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
