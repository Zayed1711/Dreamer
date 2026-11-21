-- 0005_admin_and_sessions.sql
-- Phase 7: Admin panel, ads targeting, advisor sessions quota, and proof retention tracking.

-- 1. Add proof deletion tracking to advisors (30-day proof file retention rule)
alter table advisors
  add column if not exists proof_deleted_at timestamptz;

-- 2. Enforce advisor session creation quota: maximum 2 sessions per calendar week (starts_at)
create or replace function check_advisor_session_limit() returns trigger
language plpgsql as $$
declare
  week_count int;
  week_start timestamptz;
begin
  week_start := date_trunc('week', new.starts_at);
  select count(*) into week_count
  from advisor_sessions
  where advisor_id = new.advisor_id
    and starts_at >= week_start
    and starts_at < week_start + interval '7 days'
    and status <> 'cancelled'
    and id <> new.id;

  if week_count >= 2 then
    raise exception 'Advisors may create at most 2 sessions per calendar week';
  end if;
  return new;
end;
$$;

drop trigger if exists advisor_session_weekly_limit on advisor_sessions;
create trigger advisor_session_weekly_limit
  before insert or update of starts_at on advisor_sessions
  for each row execute function check_advisor_session_limit();

-- 3. Indexes for fast admin queries, session lookups, and ad event aggregations
create index if not exists ad_events_event_created on ad_events (event, created_at desc);
create index if not exists ad_events_milestone on ad_events (milestone_key);
create index if not exists advisor_sessions_topic_starts on advisor_sessions (topic, starts_at);
create index if not exists advisor_sessions_advisor_starts on advisor_sessions (advisor_id, starts_at);
create index if not exists bookings_session_status on bookings (session_id, status);
create index if not exists scam_checks_risk_created on scam_checks (risk_level, created_at desc);
