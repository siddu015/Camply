import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { AcademicContextData } from '../types/academic';

export const useAcademicData = (userId: string | undefined): AcademicContextData => {
  const [academicData, setAcademicData] = useState<AcademicContextData>({
    user: null,
    academicDetails: null,
    college: null,
    currentYear: null,
    totalYears: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setAcademicData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchAcademicData = async () => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (userError) throw new Error('Failed to fetch user data');
        
        let academicDetails = null;
        let college = null;
        
        if (userData?.academic_id) {
          const { data: academicData, error: academicError } = await supabase
            .from('user_academic_details')
            .select('*')
            .eq('academic_id', userData.academic_id)
            .single();
            
          if (academicError) throw new Error('Failed to fetch academic details');
          academicDetails = academicData;
          
          if (academicData.college_id) {
            const { data: collegeData, error: collegeError } = await supabase
              .from('colleges')
              .select('*')
              .eq('college_id', academicData.college_id)
              .single();
              
            if (collegeError) throw new Error('Failed to fetch college data');
            college = collegeData;
          }
        }
        
        const currentYear = calculateCurrentYear(academicDetails?.admission_year);
        const totalYears = academicDetails ? 
          academicDetails.graduation_year - academicDetails.admission_year : null;
        
        setAcademicData({
          user: userData,
          academicDetails,
          college,
          currentYear,
          totalYears,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching academic data:', error);
        setAcademicData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        }));
      }
    };
    
    fetchAcademicData();
  }, [userId]);
  
  return academicData;
};

const calculateCurrentYear = (admissionYear: number | undefined): number | null => {
  if (!admissionYear) return null;
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const yearDifference = currentYear - admissionYear;
  const adjustedYear = currentMonth < 8 ? yearDifference : yearDifference + 1;
  
  return adjustedYear;
}; 