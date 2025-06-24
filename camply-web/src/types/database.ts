export interface User {
  user_id: string;
  name: string;
  email: string;
  phone_number?: string;
  profile_photo_url?: string;
  academic_id?: string;
  created_at?: string;
}

export interface UserAcademicDetails {
  academic_id?: string;
  user_id: string;
  college_id?: string;
  department_name: string;
  branch_name: string;
  admission_year: number;
  graduation_year: number;
  roll_number: string;
  latest_semester_id?: string;
  created_at?: string;
}

export interface UserFormData {
  name: string;
  phone_number?: string;
  college_id: string;
  department_name: string;
  branch_name: string;
  admission_year: number;
  graduation_year: number;
  roll_number: string;
}

export interface UserStatus {
  exists: boolean;
  hasAcademicDetails: boolean;
  userData?: User;
}

export interface College {
  college_id: string;
  name: string;
  city?: string;
  state?: string;
  university_name?: string;
  college_icon?: string;
  college_website_url?: string;
  created_at?: string;
}

export interface DepartmentData {
  [category: string]: string[];
}

// Handbook System Interfaces
export interface UserHandbook {
  handbook_id: string;
  user_id: string;
  academic_id: string;
  storage_path: string;
  original_filename: string;
  file_size_bytes?: number;
  processing_status: "uploaded" | "processing" | "completed" | "failed";
  upload_date: string;
  processed_date?: string;
  processing_started_at?: string;
  error_message?: string;
  basic_info?: Record<string, unknown>;
  semester_structure?: Record<string, unknown>;
  examination_rules?: Record<string, unknown>;
  evaluation_criteria?: Record<string, unknown>;
  attendance_policies?: Record<string, unknown>;
  academic_calendar?: Record<string, unknown>;
  course_details?: Record<string, unknown>;
  assessment_methods?: Record<string, unknown>;
  disciplinary_rules?: Record<string, unknown>;
  graduation_requirements?: Record<string, unknown>;
  fee_structure?: Record<string, unknown>;
  facilities_rules?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface HandbookUploadData {
  file: File;
  academic_id: string;
}

export interface HandbookQueryResponse {
  success: boolean;
  question: string;
  answer?: string;
  error?: string;
  sources?: string[];
} 