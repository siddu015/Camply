import { supabase } from '@/lib/supabase';
import type { Semester, SemesterFormData } from '../types';

export const checkUserSemester = async (userId: string): Promise<{ hasSemester: boolean; currentSemester: Semester | null }> => {
  try {
    const { data: academicDetails, error: academicError } = await supabase
      .from('user_academic_details')
      .select('academic_id, latest_semester_id')
      .eq('user_id', userId)
      .single();

    if (academicError || !academicDetails) {
      throw new Error('Academic details not found');
    }

    const { data: semesters, error: semesterError } = await supabase
      .from('semesters')
      .select('*')
      .eq('academic_id', academicDetails.academic_id)
      .eq('status', 'ongoing')
      .order('semester_number', { ascending: false })
      .limit(1);

    if (semesterError) {
      throw new Error('Error fetching semester data');
    }

    const currentSemester = semesters && semesters.length > 0 ? semesters[0] : null;

    return {
      hasSemester: currentSemester !== null,
      currentSemester
    };
  } catch (error) {
    console.error('Error checking user semester:', error);
    throw error;
  }
};

export const createSemester = async (userId: string, formData: SemesterFormData): Promise<Semester> => {
  try {
    // First get the academic_id
    const { data: academicDetails, error: academicError } = await supabase
      .from('user_academic_details')
      .select('academic_id')
      .eq('user_id', userId)
      .single();

    if (academicError || !academicDetails) {
      throw new Error('Academic details not found');
    }

    // Create the semester
    const { data: semester, error: semesterError } = await supabase
      .from('semesters')
      .insert({
        academic_id: academicDetails.academic_id,
        semester_number: formData.semester_number,
        status: 'ongoing',
        start_date: formData.start_date,
        end_date: formData.end_date,
        ia_dates: formData.ia_dates,
        sem_end_dates: formData.sem_end_dates
      })
      .select()
      .single();

    if (semesterError) {
      throw new Error('Error creating semester');
    }

    // Update the latest_semester_id in academic details
    const { error: updateError } = await supabase
      .from('user_academic_details')
      .update({ latest_semester_id: semester.semester_id })
      .eq('academic_id', academicDetails.academic_id);

    if (updateError) {
      console.error('Error updating latest semester ID:', updateError);
      // Don't throw here as semester was created successfully
    }

    return semester;
  } catch (error) {
    console.error('Error creating semester:', error);
    throw error;
  }
};

export const getCurrentSemester = async (userId: string): Promise<Semester | null> => {
  try {
    const { data: academicDetails, error: academicError } = await supabase
      .from('user_academic_details')
      .select('academic_id')
      .eq('user_id', userId)
      .single();

    if (academicError || !academicDetails) {
      return null;
    }

    const { data: semester, error: semesterError } = await supabase
      .from('semesters')
      .select('*')
      .eq('academic_id', academicDetails.academic_id)
      .eq('status', 'ongoing')
      .order('semester_number', { ascending: false })
      .limit(1)
      .single();

    if (semesterError) {
      return null;
    }

    return semester;
  } catch (error) {
    console.error('Error getting current semester:', error);
    return null;
  }
}; 