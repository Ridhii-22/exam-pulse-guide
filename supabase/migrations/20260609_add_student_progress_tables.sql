-- Create bookmarks table for paper bookmarks
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item_type text not null default 'paper',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, item_id, item_type)
);

-- Create paper_progress table for tracking paper completion
create table if not exists public.paper_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id uuid not null,
  completed boolean not null default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, paper_id),
  constraint paper_progress_paper_id_fkey foreign key (paper_id) references public.papers(id) on delete cascade
);

-- Create recent_activity table for tracking recent views and completions
create table if not exists public.recent_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null, -- 'view' or 'complete'
  item_id text not null,
  item_type text not null default 'paper',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.bookmarks enable row level security;
alter table public.paper_progress enable row level security;
alter table public.recent_activity enable row level security;

-- RLS policies for bookmarks
create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- RLS policies for paper_progress
create policy "Users can view their own paper progress"
  on public.paper_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own paper progress"
  on public.paper_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own paper progress"
  on public.paper_progress for update
  using (auth.uid() = user_id);

-- RLS policies for recent_activity
create policy "Users can view their own recent activity"
  on public.recent_activity for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recent activity"
  on public.recent_activity for insert
  with check (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_item_id_idx on public.bookmarks(item_id);
create index if not exists paper_progress_user_id_idx on public.paper_progress(user_id);
create index if not exists paper_progress_paper_id_idx on public.paper_progress(paper_id);
create index if not exists paper_progress_completed_idx on public.paper_progress(completed);
create index if not exists recent_activity_user_id_idx on public.recent_activity(user_id);
create index if not exists recent_activity_created_at_idx on public.recent_activity(created_at desc);

-- Add comments
comment on table public.bookmarks is 'User bookmarks for papers and other items';
comment on table public.paper_progress is 'User progress tracking for papers';
comment on table public.recent_activity is 'Recent user activity (views, completions)';
