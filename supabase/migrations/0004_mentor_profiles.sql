-- Dreamer: Mentor profile topics and founding status
-- Phase 6 migration: adds topics matching advisorTopic and founding mentor badge.

alter table advisors add column if not exists topics text[] not null default '{}';
alter table advisors add column if not exists is_founding boolean not null default false;
