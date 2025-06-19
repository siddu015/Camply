export interface Semester {
  semester_id: string;
  academic_id: string;
  semester_number: number;
  status: 'planned' | 'ongoing' | 'completed';
  start_date: string | null;
  end_date: string | null;
  ia1_date: string | null;
  ia2_date: string | null;
  sem_exam_date: string | null;
  marksheet_storage_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface SemesterFormData {
  semester_number: number;
  start_date: string;
  end_date: string;
  ia1_date: string;
  ia2_date: string;
  sem_exam_date: string;
}

// Legacy interfaces for backward compatibility (can be removed after migration)
export interface IADate {
  name: string;
  start: string;
  end: string;
}

export interface SemEndDates {
  start: string;
  end: string;
}

export interface SemesterStatus {
  hasSemester: boolean;
  currentSemester: Semester | null;
  loading: boolean;
  error: string | null;
} 