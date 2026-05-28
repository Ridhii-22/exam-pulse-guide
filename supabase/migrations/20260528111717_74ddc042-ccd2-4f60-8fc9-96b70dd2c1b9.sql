
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  target_year int,
  xp int not null default 0,
  level int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

-- handle new user trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, target_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'target_year','')::int
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- LECTURE PROGRESS
create table public.lecture_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lecture_id text not null,
  subject text,
  chapter text,
  progress_percent int not null default 0,
  last_position_seconds int not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id, lecture_id)
);
grant select, insert, update, delete on public.lecture_progress to authenticated;
grant all on public.lecture_progress to service_role;
alter table public.lecture_progress enable row level security;
create policy "own lp all" on public.lecture_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TEST ATTEMPTS
create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id text,
  title text not null,
  kind text not null default 'mock',
  subject text,
  score int not null default 0,
  total int not null default 0,
  accuracy numeric(5,2) not null default 0,
  time_taken_seconds int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.test_attempts to authenticated;
grant all on public.test_attempts to service_role;
alter table public.test_attempts enable row level security;
create policy "own ta all" on public.test_attempts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- QUESTION ATTEMPTS
create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  chapter text not null,
  is_correct boolean not null,
  skipped boolean not null default false,
  test_attempt_id uuid references public.test_attempts(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.question_attempts to authenticated;
grant all on public.question_attempts to service_role;
alter table public.question_attempts enable row level security;
create policy "own qa all" on public.question_attempts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- BOOKMARKS
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id, item_type, item_id)
);
grant select, insert, update, delete on public.bookmarks to authenticated;
grant all on public.bookmarks to service_role;
alter table public.bookmarks enable row level security;
create policy "own bm all" on public.bookmarks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- DAILY ACTIVITY (for streaks)
create table public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  questions_solved int not null default 0,
  lectures_watched int not null default 0,
  tests_taken int not null default 0,
  study_seconds int not null default 0,
  unique(user_id, activity_date)
);
grant select, insert, update, delete on public.daily_activity to authenticated;
grant all on public.daily_activity to service_role;
alter table public.daily_activity enable row level security;
create policy "own da all" on public.daily_activity for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index on public.lecture_progress(user_id);
create index on public.test_attempts(user_id, created_at desc);
create index on public.question_attempts(user_id, subject, chapter);
create index on public.daily_activity(user_id, activity_date desc);
