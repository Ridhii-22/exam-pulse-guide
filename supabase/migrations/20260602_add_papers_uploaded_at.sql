-- Add uploaded_at column to papers for explicit upload timestamp

alter table public.papers add column if not exists uploaded_at timestamptz;

-- Set uploaded_at to created_at for existing rows where uploaded_at is null
update public.papers set uploaded_at = created_at where uploaded_at is null and created_at is not null;

-- Ensure new rows have uploaded_at default if not provided
alter table public.papers alter column uploaded_at set default now();

create index if not exists papers_uploaded_at_idx on public.papers(uploaded_at);
