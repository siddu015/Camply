-- Migration: Create Handbook System
-- Date: 2025-01-08
-- Description: Add handbook upload, processing, and query system

-- Create handbooks storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
values (
  'handbooks', 
  'handbooks', 
  false, 
  104857600, -- 100MB limit
  array['application/pdf']
);

-- Create user_handbooks table
create table public.user_handbooks (
  handbook_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users not null,
  academic_id uuid references public.user_academic_details not null,

  -- Storage info
  storage_path text not null,
  original_filename varchar not null,
  file_size_bytes bigint,

  -- Processing status
  processing_status varchar default 'uploaded' check (processing_status in ('uploaded', 'processing', 'completed', 'failed')),
  upload_date timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_date timestamp with time zone,
  processing_started_at timestamp with time zone,
  error_message text,

  -- Structured JSON Data (extracted from handbook)
  basic_info jsonb,
  semester_structure jsonb,
  examination_rules jsonb,
  evaluation_criteria jsonb,
  attendance_policies jsonb,
  academic_calendar jsonb,
  course_details jsonb,
  assessment_methods jsonb,
  disciplinary_rules jsonb,
  graduation_requirements jsonb,
  fee_structure jsonb,
  facilities_rules jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on user_handbooks
alter table public.user_handbooks enable row level security;

-- RLS Policies for user_handbooks
create policy "Users can view own handbooks" on public.user_handbooks
  for select using (user_id = auth.uid());

create policy "Users can insert own handbooks" on public.user_handbooks
  for insert with check (user_id = auth.uid());

create policy "Users can update own handbooks" on public.user_handbooks
  for update using (user_id = auth.uid());

create policy "Users can delete own handbooks" on public.user_handbooks
  for delete using (user_id = auth.uid());

-- Storage policies for handbooks bucket
create policy "Users can upload own handbooks" on storage.objects
  for insert with check (
    bucket_id = 'handbooks' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own handbooks" on storage.objects
  for select using (
    bucket_id = 'handbooks' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own handbooks" on storage.objects
  for update using (
    bucket_id = 'handbooks' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own handbooks" on storage.objects
  for delete using (
    bucket_id = 'handbooks' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Indexes for performance
create index idx_user_handbooks_user_id on public.user_handbooks(user_id);
create index idx_user_handbooks_academic_id on public.user_handbooks(academic_id);
create index idx_user_handbooks_status on public.user_handbooks(processing_status);
create index idx_user_handbooks_upload_date on public.user_handbooks(upload_date desc);

-- Trigger to update updated_at timestamp
create trigger update_user_handbooks_updated_at 
    before update on public.user_handbooks 
    for each row execute function update_updated_at_column();

-- Remove old college_rulebook_url column from user_academic_details
alter table public.user_academic_details drop column if exists college_rulebook_url;

-- Add comment for documentation
comment on table public.user_handbooks is 'Stores uploaded academic handbooks and their processed data';
comment on column public.user_handbooks.processing_status is 'Status: uploaded, processing, completed, failed';
comment on column public.user_handbooks.storage_path is 'Path in Supabase Storage handbooks bucket'; 