-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create colleges table
create table public.colleges (
  college_id uuid primary key default uuid_generate_v4(),
  name varchar not null,
  city varchar,
  state varchar,
  university_name varchar,
  campus_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users table
create table public.users (
  user_id uuid references auth.users primary key,
  name varchar not null,
  email varchar not null,
  phone_number varchar,
  profile_photo_url text,
  academic_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Academic details table
create table public.user_academic_details (
  academic_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users not null,
  college_id uuid references public.colleges,
  department_name varchar not null,
  branch_name varchar not null,
  admission_year integer not null,
  graduation_year integer not null,
  roll_number varchar not null,
  college_rulebook_url text,
  latest_semester_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Semesters table
create table public.semesters (
  semester_id uuid primary key default uuid_generate_v4(),
  academic_id uuid references public.user_academic_details not null,
  semester_number integer not null,
  time_table_url text,
  number_of_ias integer,
  sem_end_marksheet_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Courses table
create table public.courses (
  course_id uuid primary key default uuid_generate_v4(),
  semester_id uuid references public.semesters not null,
  course_name varchar not null,
  syllabus_url text,
  credits integer,
  unit_notes jsonb,
  important_question_papers jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.user_academic_details enable row level security;
alter table public.semesters enable row level security;
alter table public.courses enable row level security;
alter table public.colleges enable row level security;

-- Policies for users
create policy "Users can view own data" on public.users
  for select using (auth.uid() = user_id);
create policy "Users can update own data" on public.users
  for update using (auth.uid() = user_id);
create policy "Users can insert own data" on public.users
  for insert with check (auth.uid() = user_id);

-- Policies for academic details
create policy "Users can view own academic details" on public.user_academic_details
  for select using (user_id = auth.uid());
create policy "Users can update own academic details" on public.user_academic_details
  for update using (user_id = auth.uid());
create policy "Users can insert own academic details" on public.user_academic_details
  for insert with check (user_id = auth.uid());

-- Semester policies
create policy "Users can view own semesters" on public.semesters
  for select using (
    exists (
      select 1 from public.user_academic_details
      where academic_id = semesters.academic_id
      and user_id = auth.uid()
    )
  );
create policy "Users can update own semesters" on public.semesters
  for update using (
    exists (
      select 1 from public.user_academic_details
      where academic_id = semesters.academic_id
      and user_id = auth.uid()
    )
  );
create policy "Users can insert own semesters" on public.semesters
  for insert with check (
    exists (
      select 1 from public.user_academic_details
      where academic_id = semesters.academic_id
      and user_id = auth.uid()
    )
  );

-- Course policies
create policy "Users can view own courses" on public.courses
  for select using (
    exists (
      select 1 from public.semesters s
      join public.user_academic_details uad on s.academic_id = uad.academic_id
      where s.semester_id = courses.semester_id
      and uad.user_id = auth.uid()
    )
  );
create policy "Users can update own courses" on public.courses
  for update using (
    exists (
      select 1 from public.semesters s
      join public.user_academic_details uad on s.academic_id = uad.academic_id
      where s.semester_id = courses.semester_id
      and uad.user_id = auth.uid()
    )
  );
create policy "Users can insert own courses" on public.courses
  for insert with check (
    exists (
      select 1 from public.semesters s
      join public.user_academic_details uad on s.academic_id = uad.academic_id
      where s.semester_id = courses.semester_id
      and uad.user_id = auth.uid()
    )
  );

-- Colleges can be read by all
create policy "Anyone can view colleges" on public.colleges
  for select using (true);

-- Add foreign key constraints after tables are created
alter table public.users 
  add constraint fk_academic_details 
  foreign key (academic_id) 
  references public.user_academic_details(academic_id);

alter table public.user_academic_details
  add constraint fk_latest_semester
  foreign key (latest_semester_id)
  references public.semesters(semester_id); 