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
  college_rulebook_url?: string;
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
}

export interface DepartmentData {
  [category: string]: string[];
} 