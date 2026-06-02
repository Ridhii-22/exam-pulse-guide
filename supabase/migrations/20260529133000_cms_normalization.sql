-- CMS normalization for scalable NEET content management

-- Subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.subjects to service_role;
alter table public.subjects enable row level security;
create policy "service role only subjects" on public.subjects for all to authenticated using (false) with check (false);

-- Chapters
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(subject_id, name)
);
grant all on public.chapters to service_role;
alter table public.chapters enable row level security;
create policy "service role only chapters" on public.chapters for all to authenticated using (false) with check (false);

-- Syllabus versions
create table if not exists public.syllabus_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  effective_year int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.syllabus_versions to service_role;
alter table public.syllabus_versions enable row level security;
create policy "service role only syllabus_versions" on public.syllabus_versions for all to authenticated using (false) with check (false);

-- Chapter-year mapping (syllabus tracking)
create table if not exists public.chapter_year_mapping (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  syllabus_version_id uuid not null references public.syllabus_versions(id) on delete cascade,
  year int not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(chapter_id, syllabus_version_id, year)
);
grant all on public.chapter_year_mapping to service_role;
alter table public.chapter_year_mapping enable row level security;
create policy "service role only chapter_year_mapping" on public.chapter_year_mapping for all to authenticated using (false) with check (false);

-- Question option normalization
create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.question_options to service_role;
alter table public.question_options enable row level security;
create policy "service role only question_options" on public.question_options for all to authenticated using (false) with check (false);

-- Test / paper question assignment tables
create table if not exists public.paper_questions (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.papers(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(paper_id, question_id)
);
grant all on public.paper_questions to service_role;
alter table public.paper_questions enable row level security;
create policy "service role only paper_questions" on public.paper_questions for all to authenticated using (false) with check (false);

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(test_id, question_id)
);
grant all on public.test_questions to service_role;
alter table public.test_questions enable row level security;
create policy "service role only test_questions" on public.test_questions for all to authenticated using (false) with check (false);

-- User progress tracking
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  progress_percent int not null default 0,
  completed boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entity_type, entity_id)
);
grant all on public.user_progress to service_role;
alter table public.user_progress enable row level security;
create policy "service role only user_progress" on public.user_progress for all to authenticated using (false) with check (false);

-- Normalize existing content relationships and support future dynamic mapping.

insert into public.subjects (name, created_at, updated_at)
select distinct trim(subject), now(), now()
from public.questions
where subject is not null and trim(subject) <> ''
on conflict (name) do nothing;

insert into public.subjects (name, created_at, updated_at)
select distinct trim(subject), now(), now()
from public.tests
where subject is not null and trim(subject) <> ''
on conflict (name) do nothing;

insert into public.subjects (name, created_at, updated_at)
select distinct trim(subject), now(), now()
from public.lectures
where subject is not null and trim(subject) <> ''
on conflict (name) do nothing;

insert into public.chapters (subject_id, name, slug, created_at, updated_at)
select s.id, trim(q.chapter), regexp_replace(lower(trim(q.chapter)), '[^a-z0-9]+', '-', 'g'), now(), now()
from public.questions q
join public.subjects s on trim(q.subject) = s.name
where q.chapter is not null and trim(q.chapter) <> ''
on conflict (subject_id, name) do nothing;

insert into public.chapters (subject_id, name, slug, created_at, updated_at)
select distinct s.id, trim(l.chapter), regexp_replace(lower(trim(l.chapter)), '[^a-z0-9]+', '-', 'g'), now(), now()
from public.lectures l
join public.subjects s on trim(l.subject) = s.name
where l.chapter is not null and trim(l.chapter) <> ''
on conflict (subject_id, name) do nothing;

alter table public.questions add column if not exists subject_id uuid references public.subjects(id);
alter table public.questions add column if not exists chapter_id uuid references public.chapters(id);

update public.questions q
set subject_id = s.id
from public.subjects s
where trim(q.subject) = s.name;

update public.questions q
set chapter_id = c.id
from public.chapters c
join public.subjects s on c.subject_id = s.id
where trim(q.subject) = s.name and trim(q.chapter) = c.name;

alter table public.tests add column if not exists subject_id uuid references public.subjects(id);
update public.tests t
set subject_id = s.id
from public.subjects s
where trim(t.subject) = s.name;

alter table public.lectures add column if not exists subject_id uuid references public.subjects(id);
alter table public.lectures add column if not exists chapter_id uuid references public.chapters(id);

update public.lectures l
set subject_id = s.id
from public.subjects s
where trim(l.subject) = s.name;

update public.lectures l
set chapter_id = c.id
from public.chapters c
join public.subjects s on c.subject_id = s.id
where trim(l.subject) = s.name and trim(l.chapter) = c.name;

insert into public.question_options (question_id, option_text, is_correct, position, created_at, updated_at)
select q.id, opt, opt = q.correct_answer, ord, now(), now()
from public.questions q,
unnest(q.options) with ordinality as row(opt, ord)
where array_length(q.options, 1) > 0;

insert into public.test_questions (test_id, question_id, position, created_at, updated_at)
select t.id, qid, ord, now(), now()
from public.tests t,
unnest(t.question_ids) with ordinality as row(qid, ord)
where array_length(t.question_ids, 1) > 0;

create index if not exists idx_questions_subject_id on public.questions(subject_id);
create index if not exists idx_questions_chapter_id on public.questions(chapter_id);
create index if not exists idx_chapters_subject_id on public.chapters(subject_id);
create index if not exists idx_question_options_question_id on public.question_options(question_id);
create index if not exists idx_test_questions_test_id on public.test_questions(test_id);
create index if not exists idx_paper_questions_paper_id on public.paper_questions(paper_id);
create index if not exists idx_user_progress_user_id on public.user_progress(user_id);
