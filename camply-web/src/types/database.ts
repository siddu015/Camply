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
  basic_info?: any;
  semester_structure?: any;
  examination_rules?: any;
  evaluation_criteria?: any;
  attendance_policies?: any;
  academic_calendar?: any;
  course_details?: any;
  assessment_methods?: any;
  disciplinary_rules?: any;
  graduation_requirements?: any;
  fee_structure?: any;
  facilities_rules?: any;
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