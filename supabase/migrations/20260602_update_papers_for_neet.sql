-- Update papers table for NEET-specific organization
-- Remove generic fields and add NEET-specific fields

-- Add paper_type field for categorization
alter table public.papers add column if not exists paper_type text;

-- Add chapter field for chapter-wise papers
alter table public.papers add column if not exists chapter text;

-- Update existing records to have default paper_type
update public.papers set paper_type = 'Full NEET PYQ' where paper_type is null;

-- Drop old category column if it exists (no longer needed)
alter table public.papers drop column if exists category;

-- Add check constraint for paper_type values (only if constraint doesn't exist)
do $$
begin
    if not exists (
        select 1 from pg_constraint 
        where conname = 'check_paper_type' 
        and conrelid = 'public.papers'::regclass
    ) then
        alter table public.papers add constraint check_paper_type 
        check (paper_type in ('Full NEET PYQ', 'Subject Wise', 'Chapter Wise', 'Mock Test') or paper_type is null);
    end if;
end $$;

-- Note: Subject check constraint not added to allow flexibility for existing data
-- Subjects should be validated at the application level

-- Create indexes for filtering
create index if not exists papers_paper_type_idx on public.papers(paper_type);
create index if not exists papers_chapter_idx on public.papers(chapter);

-- Add comment to document the NEET-specific structure
comment on column public.papers.paper_type is 'Type of NEET paper: Full NEET PYQ, Subject Wise, Chapter Wise, Mock Test';
comment on column public.papers.chapter is 'Chapter name (required for Chapter Wise papers, optional otherwise)';
comment on column public.papers.subject is 'NEET subject: Physics, Chemistry, Biology';
