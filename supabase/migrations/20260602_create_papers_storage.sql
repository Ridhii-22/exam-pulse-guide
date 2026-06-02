-- Create papers storage bucket if it doesn't exist
-- Note: Storage buckets are typically created via Supabase dashboard or CLI
-- This migration sets up the bucket policies for public access

-- Insert storage bucket record (if bucket was created manually)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papers', 'papers', true, 52428800, ARRAY['application/pdf'])
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf'];

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Policy: Allow public read access to papers bucket
create policy "Allow public read access to papers"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'papers');

-- Policy: Allow authenticated users to upload to papers bucket
create policy "Allow authenticated upload to papers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'papers');

-- Policy: Allow authenticated users to update papers bucket
create policy "Allow authenticated update to papers"
on storage.objects for update
to authenticated
using (bucket_id = 'papers');

-- Policy: Allow service role full access to papers bucket
create policy "Service role full access to papers"
on storage.objects for all
to service_role
using (bucket_id = 'papers')
with check (bucket_id = 'papers');
