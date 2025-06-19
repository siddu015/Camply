-- Migration to update semester table from JSON dates to individual date fields
-- Drop the JSONB columns and add individual date columns

ALTER TABLE public.semesters 
  DROP COLUMN IF EXISTS ia_dates,
  DROP COLUMN IF EXISTS sem_end_dates,
  ADD COLUMN ia1_date date,
  ADD COLUMN ia2_date date,
  ADD COLUMN sem_exam_date date;

-- Update comments for the new columns
COMMENT ON COLUMN public.semesters.ia1_date IS 'Date for IA-1 examination';
COMMENT ON COLUMN public.semesters.ia2_date IS 'Date for IA-2 examination';
COMMENT ON COLUMN public.semesters.sem_exam_date IS 'Start date for semester end examination';

-- The end_date column already exists and represents when the semester/exams end
COMMENT ON COLUMN public.semesters.end_date IS 'End date of the semester (when semester end exams end)'; 