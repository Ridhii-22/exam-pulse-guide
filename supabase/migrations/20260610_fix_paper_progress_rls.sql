-- Fix paper_progress foreign key constraint to work with RLS
-- The issue is that papers table has "service role only" RLS policy
-- which blocks foreign key validation when inserting into paper_progress

-- Drop the foreign key constraint that requires papers table access
alter table public.paper_progress drop constraint if exists paper_progress_paper_id_fkey;

-- Add a check constraint to ensure paper_id is a valid UUID format
alter table public.paper_progress add constraint paper_progress_paper_id_check 
  check (paper_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Note: We rely on application-level validation to ensure paper_id exists
-- This is necessary because papers table has restrictive RLS policies
