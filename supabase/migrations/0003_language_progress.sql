-- Dreamer: language track progress per language
-- Phase 5 migration: tracks level and completed quizzes per language track.

create table language_progress (
  user_id uuid not null references profiles (id) on delete cascade,
  lang text not null check (lang in ('de', 'ja')),
  level int not null default 1 check (level between 1 and 6),
  quizzes_completed int not null default 0 check (quizzes_completed >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, lang)
);

alter table language_progress enable row level security;

-- Language progress: own rows only, admins can read.
create policy language_progress_own on language_progress for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
