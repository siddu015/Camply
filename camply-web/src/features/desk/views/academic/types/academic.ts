import type { User, UserAcademicDetails, College } from "@/types/database";

export interface AcademicContextData {
  user: User | null;
  academicDetails: UserAcademicDetails | null;
  college: College | null;
  currentYear: number | null;
  totalYears: number | null;
  loading: boolean;
  error: string | null;
}

export interface TimelineItem {
  year: number;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
} 