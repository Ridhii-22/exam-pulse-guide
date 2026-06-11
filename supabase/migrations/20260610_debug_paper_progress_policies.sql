-- SQL to inspect paper_progress RLS policies
SELECT *
FROM pg_policies
WHERE tablename = 'paper_progress';

-- SQL to check if RLS is enabled on paper_progress
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'paper_progress'
AND relnamespace = 'public'::regnamespace;

-- SQL to check exact schema of paper_progress
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'paper_progress'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- SQL to check constraints on paper_progress
SELECT 
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'paper_progress'
AND rel.relnamespace = 'public'::regnamespace;

-- SQL to manually test inserting a record into paper_progress
-- Replace 'YOUR_USER_ID' and 'YOUR_PAPER_ID' with actual values
-- Run this as the authenticated user to test RLS policies

-- First, get your user ID
SELECT auth.uid();

-- Then, get a valid paper ID
SELECT id, title FROM public.papers LIMIT 1;

-- Finally, test the insert (replace with actual IDs)
INSERT INTO public.paper_progress (
  user_id,
  paper_id,
  completed,
  completed_at,
  updated_at
) VALUES (
  auth.uid(),
  (SELECT id FROM public.papers LIMIT 1),
  true,
  now(),
  now()
);

-- Check if the insert worked
SELECT * FROM public.paper_progress WHERE user_id = auth.uid();
