-- update_semester_schema.sql

-- Drop existing foreign key constraint from user_academic_details to semesters to modify the tables
alter table public.user_academic_details drop constraint if exists fk_latest_semester;

-- 1. Alter 'semesters' table
-- Drop obsolete columns
alter table public.semesters drop column if exists time_table_url;
alter table public.semesters drop column if exists number_of_ias;

-- Rename column for clarity
alter table public.semesters rename column sem_end_marksheet_url to marksheet_storage_path;

-- Add new columns
alter table public.semesters add column if not exists status varchar default 'planned' check (status in ('planned', 'ongoing', 'completed'));
alter table public.semesters add column if not exists start_date date;
alter table public.semesters add column if not exists end_date date;
alter table public.semesters add column if not exists ia_dates jsonb;
alter table public.semesters add column if not exists sem_end_dates jsonb;
alter table public.semesters add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

comment on column public.semesters.status is 'Status of the semester (e.g., planned, ongoing, completed)';
comment on column public.semesters.ia_dates is 'JSON array of IA schedules, e.g., [{"name": "IA-1", "start": "...", "end": "..."}]';
comment on column public.semesters.sem_end_dates is 'JSON object with semester end exam dates';

-- Add trigger for updated_at on semesters
create trigger update_semesters_updated_at
    before update on public.semesters
    for each row execute function update_updated_at_column();

-- 2. Alter 'courses' table
-- Drop obsolete columns
alter table public.courses drop column if exists unit_notes;
alter table public.courses drop column if exists important_question_papers;

-- Rename column
alter table public.courses rename column syllabus_url to syllabus_storage_path;

-- Add new column
alter table public.courses add column if not exists course_code varchar;
alter table public.courses add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;


-- Add trigger for updated_at on courses
create trigger update_courses_updated_at
    before update on public.courses
    for each row execute function update_updated_at_column();


-- 3. Create 'assessments' table
create table if not exists public.assessments (
  assessment_id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(course_id) on delete cascade not null,
  assessment_type varchar not null,
  max_marks numeric(5, 2),
  marks_obtained numeric(5, 2),
  assessment_date date,
  weightage numeric(5, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on column public.assessments.assessment_type is 'Type of assessment (e.g., IA-1, IA-2, Quiz, Assignment, Semester End Exam)';

-- Enable RLS for assessments
alter table public.assessments enable row level security;

-- Policies for assessments
create policy "Users can view own assessments" on public.assessments
  for select using (
    exists (
      select 1 from public.courses c
      join public.semesters s on c.semester_id = s.semester_id
      join public.user_academic_details uad on s.academic_id = uad.academic_id
      where c.course_id = assessments.course_id
      and uad.user_id = auth.uid()
    )
  );

create policy "Users can manage own assessments" on public.assessments
  for all using (
    exists (
      select 1 from public.courses c
      join public.semesters s on c.semester_id = s.semester_id
      join public.user_academic_details uad on s.academic_id = uad.academic_id
      where c.course_id = assessments.course_id
      and uad.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at on assessments
create trigger update_assessments_updated_at
    before update on public.assessments
    for each row execute function update_updated_at_column();
    
-- Add indexes for assessments
create index if not exists idx_assessments_course_id on public.assessments(course_id);

-- 4. Re-create foreign key constraint from user_academic_details to semesters
alter table public.user_academic_details
  add constraint fk_latest_semester
  foreign key (latest_semester_id)
  references public.semesters(semester_id)
  on delete set null;

-- 5. Create storage buckets
insert into storage.buckets (id, name, public, file_size_limit)
values ('marksheets', 'marksheets', false, 10485760) -- 10MB limit
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('course_documents', 'course_documents', false, 10485760) -- 10MB limit
on conflict (id) do nothing;

-- 6. Add policies for new storage buckets
-- Policies for marksheets (assuming path is user_id/file.pdf)
create policy "Users can manage own marksheets" on storage.objects
  for all to authenticated using (
    bucket_id = 'marksheets'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'marksheets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policies for course_documents (assuming path is user_id/course_id/file.pdf)
create policy "Users can manage own course documents" on storage.objects
  for all to authenticated using (
    bucket_id = 'course_documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'course_documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
