-- ADMIN CMS AND CONTENT MANAGEMENT TABLES

alter table public.profiles add column if not exists role text not null default 'student';
alter table public.profiles alter column role set default 'student';
update public.profiles set role = 'student' where role is null;

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  chapter text not null,
  topic text not null,
  difficulty text not null default 'medium',
  question_text text not null,
  options text[] not null default array[]::text[],
  correct_answer text not null,
  explanation text,
  year text,
  question_type text not null default 'single_choice',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.questions to service_role;
alter table public.questions enable row level security;
create policy "service role only questions" on public.questions for all to authenticated using (false) with check (false);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null,
  subject text,
  timer_seconds int not null default 0,
  total_marks int not null default 0,
  section_config jsonb,
  question_ids uuid[] not null default array[]::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.tests to service_role;
alter table public.tests enable row level security;
create policy "service role only tests" on public.tests for all to authenticated using (false) with check (false);

create table public.papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year text,
  category text,
  pdf_url text not null,
  attempt_as_test boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.papers to service_role;
alter table public.papers enable row level security;
create policy "service role only papers" on public.papers for all to authenticated using (false) with check (false);

create table public.lectures (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text,
  chapter text,
  resource_url text not null,
  playlist_id text,
  description text,
  duration_seconds int not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.lectures to service_role;
alter table public.lectures enable row level security;
create policy "service role only lectures" on public.lectures for all to authenticated using (false) with check (false);
