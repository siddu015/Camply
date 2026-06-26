export interface Course {
  course_id: string;
  semester_id: string;
  semester_number: number;
  course_name: string;
  course_code: string | null;
  course_type: 'theory' | 'lab';
  syllabus_storage_path: string | null;
  syllabus_json: any | null;
  credits: number | null;
  created_at: string;
  updated_at: string;
}

export interface AddCourseData {
  course_name: string;
  course_code?: string;
  course_type: 'theory' | 'lab';
  credits?: number;
}

export interface UpdateCourseData {
  course_name?: string;
  course_code?: string;
  course_type?: 'theory' | 'lab';
  credits?: number;
} 