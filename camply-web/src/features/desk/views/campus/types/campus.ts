export interface CacheStatus {
  isCached: boolean;
  lastFetch?: Date;
  expiresAt?: Date;
}

export interface College {
  college_id: string;
  name: string;
  city?: string;
  state?: string;
  college_website_url?: string;
  college_icon?: string;
}

export interface AcademicDetails {
  department_name: string;
  branch_name?: string;
}

export interface CampusPromptConfig {
  title: string;
  description: string;
  prompt: string;
} 