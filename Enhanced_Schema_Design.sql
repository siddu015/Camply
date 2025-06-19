-- =============================================
-- CAMPLY ENHANCED DATABASE SCHEMA
-- Supports: Advanced Course Management, Study Sessions, Notes, Analytics, etc.
-- =============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- =============================================
-- CORE ENTITIES (Enhanced from existing)
-- =============================================

-- Enhanced courses table with detailed structure
create table public.courses (
  course_id uuid primary key default uuid_generate_v4(),
  semester_id uuid references public.semesters not null,
  course_name varchar not null,
  course_code varchar,
  credits integer,
  syllabus_storage_path text,
  description text,
  difficulty_level varchar check (difficulty_level in ('easy', 'medium', 'hard')),
  course_type varchar check (course_type in ('core', 'elective', 'practical', 'project')),
  instructor_name varchar,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================
-- COURSE STRUCTURE SYSTEM
-- =============================================

-- Course units (chapters/modules)
create table public.course_units (
  unit_id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(course_id) on delete cascade not null,
  unit_number integer not null,
  unit_name varchar not null,
  unit_description text,
  estimated_hours integer, -- Study time estimation
  difficulty_level varchar check (difficulty_level in ('easy', 'medium', 'hard')),
  is_completed boolean default false,
  completion_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(course_id, unit_number)
);

-- Unit topics (granular learning points)
create table public.unit_topics (
  topic_id uuid primary key default uuid_generate_v4(),
  unit_id uuid references public.course_units(unit_id) on delete cascade not null,
  topic_number integer not null,
  topic_name varchar not null,
  topic_description text,
  estimated_minutes integer, -- Study time for this topic
  topic_type varchar check (topic_type in ('theory', 'practical', 'example', 'exercise')),
  difficulty_level varchar check (difficulty_level in ('easy', 'medium', 'hard')),
  prerequisites jsonb, -- Array of prerequisite topic_ids
  learning_outcomes text[],
  is_completed boolean default false,
  completion_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(unit_id, topic_number)
);

-- =============================================
-- STUDY MANAGEMENT SYSTEM
-- =============================================

-- Study sessions (IA-1, IA-2, Semester prep)
create table public.study_sessions (
  session_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(user_id) not null,
  course_id uuid references public.courses(course_id) not null,
  session_type varchar not null check (session_type in ('ia1_prep', 'ia2_prep', 'semester_prep', 'revision', 'practice', 'custom')),
  session_name varchar not null,
  target_assessment_date date,
  start_date date,
  end_date date,
  is_active boolean default true,
  completion_percentage numeric(5,2) default 0,
  total_study_hours integer default 0,
  target_hours integer,
  session_notes text,
  ai_recommendations jsonb, -- AI-generated study plan
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study session units (which units to cover in this session)
create table public.session_units (
  session_unit_id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.study_sessions(session_id) on delete cascade not null,
  unit_id uuid references public.course_units(unit_id) not null,
  priority_order integer not null,
  is_completed boolean default false,
  completion_date timestamp with time zone,
  study_time_spent integer default 0, -- minutes
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, unit_id)
);

-- Study progress tracking
create table public.study_progress (
  progress_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(user_id) not null,
  topic_id uuid references public.unit_topics(topic_id) not null,
  session_id uuid references public.study_sessions(session_id),
  understanding_level varchar check (understanding_level in ('not_started', 'basic', 'good', 'excellent')),
  time_spent_minutes integer default 0,
  last_studied_at timestamp with time zone,
  revision_count integer default 0,
  confidence_score integer check (confidence_score between 1 and 10),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, topic_id)
);

-- =============================================
-- NOTES AND CONTENT SYSTEM
-- =============================================

-- User notes (topic-wise, unit-wise, course-wise)
create table public.user_notes (
  note_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(user_id) not null,
  course_id uuid references public.courses(course_id),
  unit_id uuid references public.course_units(unit_id),
  topic_id uuid references public.unit_topics(topic_id),
  note_title varchar not null,
  note_content text not null,
  note_type varchar check (note_type in ('summary', 'explanation', 'formula', 'example', 'question', 'general')),
  tags text[],
  is_favorite boolean default false,
  visibility varchar check (visibility in ('private', 'shared')) default 'private',
  formatting_preferences jsonb, -- Rich text formatting, colors, etc.
  attachments jsonb, -- File references
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study materials and resources
create table public.study_materials (
  material_id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(course_id),
  unit_id uuid references public.course_units(unit_id),
  topic_id uuid references public.unit_topics(topic_id),
  material_name varchar not null,
  material_type varchar check (material_type in ('pdf', 'video', 'image', 'link', 'document', 'presentation')),
  storage_path text,
  external_url text,
  description text,
  tags text[],
  uploader_id uuid references public.users(user_id),
  is_verified boolean default false,
  download_count integer default 0,
  rating numeric(3,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================
-- ASSESSMENT AND PRACTICE SYSTEM
-- =============================================

-- Enhanced assessments table
create table public.assessments (
  assessment_id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(course_id) on delete cascade not null,
  assessment_name varchar not null,
  assessment_type varchar not null check (assessment_type in ('ia1', 'ia2', 'semester_end', 'quiz', 'assignment', 'project', 'viva')),
  max_marks numeric(5, 2),
  marks_obtained numeric(5, 2),
  percentage numeric(5, 2),
  assessment_date date,
  weightage numeric(5, 2),
  units_covered integer[],  -- Array of unit numbers
  topics_covered text[],
  difficulty_level varchar check (difficulty_level in ('easy', 'medium', 'hard')),
  time_duration_minutes integer,
  question_paper_storage_path text,
  answer_sheet_storage_path text,
  feedback text,
  improvement_areas text[],
  strengths text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Question papers and practice materials
create table public.question_papers (
  paper_id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(course_id) not null,
  paper_title varchar not null,
  paper_type varchar check (paper_type in ('previous_year', 'sample', 'practice', 'mock')),
  exam_type varchar check (exam_type in ('ia1', 'ia2', 'semester_end')),
  year integer,
  semester_number integer,
  university_name varchar,
  storage_path text not null,
  solution_storage_path text,
  units_covered integer[],
  difficulty_level varchar check (difficulty_level in ('easy', 'medium', 'hard')),
  time_duration_minutes integer,
  max_marks integer,
  question_count integer,
  is_solved boolean default false,
  uploader_id uuid references public.users(user_id),
  download_count integer default 0,
  rating numeric(3,2),
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Practice attempts tracking
create table public.practice_attempts (
  attempt_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(user_id) not null,
  paper_id uuid references public.question_papers(paper_id) not null,
  session_id uuid references public.study_sessions(session_id),
  attempt_number integer not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  time_taken_minutes integer,
  score_obtained numeric(5,2),
  total_score numeric(5,2),
  percentage numeric(5,2),
  questions_attempted integer,
  questions_correct integer,
  difficulty_rating integer check (difficulty_rating between 1 and 5),
  self_assessment text,
  areas_to_improve text[],
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, paper_id, attempt_number)
);

-- =============================================
-- ASSIGNMENT MANAGEMENT SYSTEM
-- =============================================

-- Assignments and projects
create table public.assignments (
  assignment_id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(course_id) not null,
  assignment_title varchar not null,
  assignment_type varchar check (assignment_type in ('individual', 'group', 'project', 'report', 'presentation')),
  description text not null,
  instructions_storage_path text,
  assigned_date date not null,
  due_date date not null,
  submission_date date,
  max_marks numeric(5,2),
  obtained_marks numeric(5,2),
  weightage numeric(5,2),
  status varchar check (status in ('pending', 'in_progress', 'submitted', 'graded', 'late_submission')),
  priority varchar check (priority in ('low', 'medium', 'high', 'urgent')),
  estimated_hours integer,
  actual_hours integer,
  submission_storage_path text,
  feedback text,
  grade varchar,
  is_group_assignment boolean default false,
  group_members text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Assignment progress tracking
create table public.assignment_progress (
  progress_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(user_id) not null,
  assignment_id uuid references public.assignments(assignment_id) not null,
  progress_percentage numeric(5,2) default 0,
  hours_worked integer default 0,
  last_worked_on timestamp with time zone,
  status_notes text,
  milestones_completed text[],
  next_steps text[],
  is_blocked boolean default false,
  blocked_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, assignment_id)
);

-- =============================================
-- ANALYTICS AND PERFORMANCE SYSTEM
-- =============================================

-- Academic performance analytics
create table public.performance_analytics (
  analytics_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(user_id) not null,
  course_id uuid references public.courses(course_id),
  semester_id uuid references public.semesters(semester_id),
  analytics_type varchar check (analytics_type in ('course', 'semester', 'overall', 'unit', 'topic')),
  performance_data jsonb not null, -- Detailed analytics data
  gpa numeric(4,2),
  cgpa numeric(4,2),
  attendance_percentage numeric(5,2),
  assignment_completion_rate numeric(5,2),
  study_hours_weekly integer,
  improvement_suggestions text[],
  strengths text[],
  weaknesses text[],
  career_insights text[],
  calculated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_latest boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study patterns and insights
create table public.study_insights (
  insight_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(user_id) not null,
  insight_type varchar check (insight_type in ('study_pattern', 'performance_trend', 'time_management', 'difficulty_analysis', 'recommendation')),
  title varchar not null,
  description text not null,
  data_points jsonb, -- Supporting data
  confidence_score numeric(3,2), -- How confident the AI is about this insight
  actionable_steps text[],
  priority varchar check (priority in ('low', 'medium', 'high')),
  is_acknowledged boolean default false,
  is_helpful boolean,
  user_feedback text,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================
-- USER PREFERENCES AND PERSONALIZATION
-- =============================================

-- User study preferences
create table public.user_preferences (
  preference_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(user_id) not null unique,
  study_preferences jsonb, -- Study timing, break intervals, etc.
  explanation_style varchar check (explanation_style in ('simple', 'detailed', 'visual', 'example_heavy')),
  difficulty_preference varchar check (difficulty_preference in ('gradual', 'challenging', 'mixed')),
  reminder_preferences jsonb, -- Notification settings
  ui_preferences jsonb, -- Theme, layout preferences
  ai_interaction_style varchar check (ai_interaction_style in ('formal', 'casual', 'encouraging', 'direct')),
  learning_goals text[],
  available_study_hours jsonb, -- Daily/weekly schedule
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================
-- COLLABORATION AND SOCIAL FEATURES
-- =============================================

-- Study groups
create table public.study_groups (
  group_id uuid primary key default uuid_generate_v4(),
  group_name varchar not null,
  course_id uuid references public.courses(course_id),
  semester_id uuid references public.semesters(semester_id),
  creator_id uuid references public.users(user_id) not null,
  description text,
  group_type varchar check (group_type in ('course_specific', 'semester_general', 'assignment_focused', 'exam_prep')),
  max_members integer default 10,
  current_members integer default 1,
  is_public boolean default false,
  join_code varchar unique,
  study_schedule jsonb,
  group_goals text[],
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study group members
create table public.study_group_members (
  membership_id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.study_groups(group_id) on delete cascade not null,
  user_id uuid references public.users(user_id) not null,
  role varchar check (role in ('admin', 'moderator', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true,
  contribution_score integer default 0,
  unique(group_id, user_id)
);

-- =============================================
-- CALENDAR AND SCHEDULING SYSTEM
-- =============================================

-- Academic calendar and events
create table public.academic_events (
  event_id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(user_id),
  course_id uuid references public.courses(course_id),
  semester_id uuid references public.semesters(semester_id),
  event_title varchar not null,
  event_type varchar check (event_type in ('class', 'exam', 'assignment_due', 'study_session', 'group_study', 'personal', 'college_event')),
  description text,
  start_datetime timestamp with time zone not null,
  end_datetime timestamp with time zone,
  location varchar,
  is_recurring boolean default false,
  recurrence_pattern jsonb, -- For recurring events
  reminder_settings jsonb,
  is_completed boolean default false,
  priority varchar check (priority in ('low', 'medium', 'high', 'urgent')),
  color_code varchar, -- For UI display
  created_at timestamp with time zone default timezone('utc'::text, now') not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================
-- STORAGE BUCKETS AND FILE MANAGEMENT
-- =============================================

-- Additional storage buckets needed
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
values 
  ('notes', 'notes', false, 52428800, array['text/plain', 'text/markdown', 'application/json']), -- 50MB for notes
  ('question_papers', 'question_papers', false, 104857600, array['application/pdf', 'image/jpeg', 'image/png']), -- 100MB for question papers
  ('assignments', 'assignments', false, 104857600, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']), -- 100MB for assignments
  ('study_materials', 'study_materials', false, 209715200, array['application/pdf', 'video/mp4', 'image/jpeg', 'image/png', 'application/vnd.ms-powerpoint']) -- 200MB for study materials
on conflict (id) do nothing;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Course structure indexes
create index idx_course_units_course_id on public.course_units(course_id);
create index idx_unit_topics_unit_id on public.unit_topics(unit_id);
create index idx_study_progress_user_topic on public.study_progress(user_id, topic_id);

-- Study session indexes
create index idx_study_sessions_user_course on public.study_sessions(user_id, course_id);
create index idx_study_sessions_active on public.study_sessions(user_id, is_active) where is_active = true;

-- Notes and materials indexes
create index idx_user_notes_user_course on public.user_notes(user_id, course_id);
create index idx_study_materials_course on public.study_materials(course_id);

-- Assessment and practice indexes
create index idx_assessments_course_type on public.assessments(course_id, assessment_type);
create index idx_practice_attempts_user_paper on public.practice_attempts(user_id, paper_id);

-- Analytics indexes
create index idx_performance_analytics_user on public.performance_analytics(user_id, is_latest) where is_latest = true;
create index idx_study_insights_user_priority on public.study_insights(user_id, priority);

-- Calendar indexes
create index idx_academic_events_user_date on public.academic_events(user_id, start_datetime);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Add updated_at triggers for all tables
create trigger update_course_units_updated_at before update on public.course_units for each row execute function update_updated_at_column();
create trigger update_unit_topics_updated_at before update on public.unit_topics for each row execute function update_updated_at_column();
create trigger update_study_sessions_updated_at before update on public.study_sessions for each row execute function update_updated_at_column();
create trigger update_study_progress_updated_at before update on public.study_progress for each row execute function update_updated_at_column();
create trigger update_user_notes_updated_at before update on public.user_notes for each row execute function update_updated_at_column();
create trigger update_study_materials_updated_at before update on public.study_materials for each row execute function update_updated_at_column();
create trigger update_assignments_updated_at before update on public.assignments for each row execute function update_updated_at_column();
create trigger update_assignment_progress_updated_at before update on public.assignment_progress for each row execute function update_updated_at_column();
create trigger update_user_preferences_updated_at before update on public.user_preferences for each row execute function update_updated_at_column();
create trigger update_study_groups_updated_at before update on public.study_groups for each row execute function update_updated_at_column();
create trigger update_academic_events_updated_at before update on public.academic_events for each row execute function update_updated_at_column(); 