-- Add metadata fields to papers table for better paper management

alter table public.papers add column if not exists subject text;
alter table public.papers add column if not exists description text;
alter table public.papers add column if not exists uploaded_by uuid references public.profiles(id) on delete set null;

-- Add index for faster filtering
create index if not exists papers_subject_idx on public.papers(subject);
create index if not exists papers_year_idx on public.papers(year);
create index if not exists papers_uploaded_by_idx on public.papers(uploaded_by);
