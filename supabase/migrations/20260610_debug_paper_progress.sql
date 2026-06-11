-- Debug paper_progress table schema and RLS policies

-- Check if table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'paper_progress'
AND table_schema = 'public';

-- Check exact schema of paper_progress
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'paper_progress'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints on paper_progress
SELECT 
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'paper_progress'
AND rel.relnamespace = 'public'::regnamespace;

-- Check if RLS is enabled
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'paper_progress'
AND relnamespace = 'public'::regnamespace;

-- Check all RLS policies for paper_progress
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'paper_progress';

-- Check if user can insert (test with current user)
-- This will fail if RLS blocks the operation
-- Run this as the authenticated user to test
