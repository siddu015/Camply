import { supabase } from '../../../../../lib/supabase';
import type { User, UserAcademicDetails, College } from '../../../../../types/database';

export const getAcademicDetails = async (userId: string): Promise<{
  user: User | null;
  academicDetails: UserAcademicDetails | null;
  college: College | null;
} | null> => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return null;
    }

    const { data: academicDetails, error: academicError } = await supabase
      .from('user_academic_details')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (academicError || !academicDetails) {
      console.error('Error fetching academic details:', academicError);
      return { user, academicDetails: null, college: null };
    }

    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('*')
      .eq('college_id', academicDetails.college_id)
      .single();

    if (collegeError) {
      console.error('Error fetching college:', collegeError);
    }

    return {
      user,
      academicDetails,
      college: college || null,
    };
  } catch (err) {
    console.error('Error fetching academic data:', err);
    return null;
  }
};

export const calculateCurrentYear = (admissionYear: number): number => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;  
  const academicYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;
  const yearsSinceAdmission = academicYearStart - admissionYear;
  
  return Math.min(Math.max(yearsSinceAdmission + 1, 1), 4);
};

export const getAcademicTimeline = (admissionYear: number, graduationYear: number) => {
  const currentYear = calculateCurrentYear(admissionYear);
  const totalYears = graduationYear - admissionYear;
  const progress = (currentYear - 1) / totalYears * 100;
  
  const years = Array.from({ length: totalYears }, (_, index) => ({
    year: index + 1,
    academicYear: `${admissionYear + index}-${admissionYear + index + 1}`,
    isCompleted: index + 1 < currentYear,
    isCurrent: index + 1 === currentYear,
    isFuture: index + 1 > currentYear,
  }));

  return {
    currentYear,
    totalYears,
    progress: Math.min(progress, 100),
    years,
    isGraduated: currentYear > totalYears,
  };
};

export const updateAcademicDetails = async (
  userId: string,
  updates: Partial<UserAcademicDetails>
): Promise<UserAcademicDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('user_academic_details')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating academic details:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error updating academic details:', err);
    return null;
  }
};

export const subscribeToAcademicChanges = (
  userId: string,
  callback: () => void
) => {
  return supabase
    .channel('academic-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_academic_details',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}; 