export interface Semester {
  semester_id: string;
  academic_id: string;
  semester_number: number;
  status: 'planned' | 'ongoing' | 'completed';
  start_date: string | null;
  end_date: string | null;
  ia_dates: IADate[] | null;
  sem_end_dates: SemEndDates | null;
  marksheet_storage_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface IADate {
  name: string;
  start: string;
  end: string;
}

export interface SemEndDates {
  start: string;
  end: string;
}

export interface SemesterFormData {
  semester_number: number;
  start_date: string;
  end_date: string;
  ia_dates: IADate[];
  sem_end_dates: SemEndDates;
}

export interface SemesterStatus {
  hasSemester: boolean;
  currentSemester: Semester | null;
  loading: boolean;
  error: string | null;
} 