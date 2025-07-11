import { supabase } from './supabase';
import type { User, UserAcademicDetails, UserFormData, UserStatus, College } from '@/types/database';


export const checkUserStatus = async (userId: string): Promise<UserStatus> => {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('user_id, name, email, phone_number, profile_photo_url, academic_id, created_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return {
      exists: !!userData,
      hasAcademicDetails: !!userData?.academic_id,
      userData: userData || undefined
    };
  } catch (error) {
    console.error('Error checking user status:', error);
    throw error;
  }
};

export const createUserWithAcademicDetails = async (
  userId: string, 
  email: string, 
  formData: UserFormData
): Promise<{ user: User; academicDetails: UserAcademicDetails }> => {
  try {
    console.log('Starting user creation for:', userId);
    console.log('Form data:', formData);

    const userInsertData = {
      user_id: userId,
      name: formData.name,
      email: email,
      phone_number: formData.phone_number || null,
      academic_id: null
    };

    console.log('Inserting user data:', userInsertData);

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(userInsertData)
      .select()
      .single();

    let currentUser = insertedUser;

    if (insertError && insertError.code === '23505') {
      console.log('User exists, updating...');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone_number: formData.phone_number || null
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }
      currentUser = updatedUser;
    } else if (insertError) {
      console.error('Error inserting user:', insertError);
      throw insertError;
    }

    console.log('User record ready:', currentUser);

    const academicInsertData = {
      user_id: userId,
      college_id: formData.college_id || null,
      department_name: formData.department_name,
      branch_name: formData.branch_name,
      admission_year: formData.admission_year,
      graduation_year: formData.graduation_year,
      roll_number: formData.roll_number
    };

    console.log('Inserting academic data:', academicInsertData);

    const { data: academicData, error: academicError } = await supabase
      .from('user_academic_details')
      .insert(academicInsertData)
      .select()
      .single();

    if (academicError) {
      console.error('Error inserting academic details:', academicError);
      throw academicError;
    }

    console.log('Academic details created:', academicData);

    const { data: finalUserData, error: finalUpdateError } = await supabase
      .from('users')
      .update({ academic_id: academicData.academic_id })
      .eq('user_id', userId)
      .select()
      .single();

    if (finalUpdateError) {
      console.error('Error updating user with academic_id:', finalUpdateError);
      throw finalUpdateError;
    }

    console.log('Final user data:', finalUserData);

    return {
      user: finalUserData,
      academicDetails: academicData
    };
  } catch (error) {
    console.error('Error creating user with academic details:', error);
    throw error;
  }
};

export const updateUserAcademicDetails = async (
  userId: string,
  formData: UserFormData
): Promise<{ user: User; academicDetails: UserAcademicDetails }> => {
  try {
    const { data: currentUser } = await supabase
      .from('users')
      .select('academic_id')
      .eq('user_id', userId)
      .single();

    if (!currentUser?.academic_id) {
      throw new Error('User has no academic details to update');
    }

    const { data: academicData, error: academicError } = await supabase
      .from('user_academic_details')
      .update({
        college_id: formData.college_id || null,
        department_name: formData.department_name,
        branch_name: formData.branch_name,
        admission_year: formData.admission_year,
        graduation_year: formData.graduation_year,
        roll_number: formData.roll_number
      })
      .eq('academic_id', currentUser.academic_id)
      .select()
      .single();

    if (academicError) throw academicError;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        name: formData.name,
        phone_number: formData.phone_number || null
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (userError) throw userError;

    return {
      user: userData,
      academicDetails: academicData
    };
  } catch (error) {
    console.error('Error updating user academic details:', error);
    throw error;
  }
};

export const getUserCampusData = async (userId: string): Promise<{
  user: User;
  academicDetails: UserAcademicDetails | null;
  college: College | null;
  currentSemester: number | null;
}> => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      throw new Error('Unable to fetch user information');
    }

    let academicDetails = null;
    let college = null;
    let currentSemester = null;

    if (userData?.academic_id) {
      try {
        const { data: academicData, error: academicError } = await supabase
          .from('user_academic_details')
          .select('*')
          .eq('academic_id', userData.academic_id)
          .single();

        if (academicError && academicError.code !== 'PGRST116') {
          console.warn('Error fetching academic details:', academicError);
        } else if (academicData) {
          academicDetails = academicData;

          if (academicData.college_id) {
            try {
              const { data: collegeData, error: collegeError } = await supabase
                .from('colleges')
                .select('*')
                .eq('college_id', academicData.college_id)
                .single();

              if (collegeError && collegeError.code !== 'PGRST116') {
                console.warn('College not found:', collegeError);
              } else if (collegeData) {
                college = collegeData;
              }
            } catch (collegeErr) {
              console.warn('Error fetching college data:', collegeErr);
            }
          }

          try {
            const { data: semesterData, error: semesterError } = await supabase
              .from('semesters')
              .select('semester_number')
              .eq('academic_id', academicData.academic_id)
              .order('semester_number', { ascending: false })
              .limit(1);
            
            if (semesterError && semesterError.code !== 'PGRST116') {
              console.warn('No semesters found:', semesterError);
            } else if (semesterData && semesterData.length > 0) {
              currentSemester = semesterData[0].semester_number;
            }
          } catch (semesterErr) {
            console.warn('Error fetching semester data:', semesterErr);
          }
        }
      } catch (academicErr) {
        console.warn('Error fetching academic data:', academicErr);               
      }
    }

    return {
      user: userData,
      academicDetails,
      college,
      currentSemester
    };
  } catch (error) {
    console.error('Critical error fetching user campus data:', error);
    throw error;
  }
};
