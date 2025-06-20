import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Course } from '../types';

export const useAllCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCourses = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // First get user's academic details to get all their semesters
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('academic_id')
        .eq('user_id', user.id)
        .single();

      if (userDataError || !userData?.academic_id) {
        throw new Error('Academic details not found');
      }

      // Get all user's semesters
      const { data: semestersData, error: semestersError } = await supabase
        .from('semesters')
        .select('semester_id, semester_number')
        .eq('academic_id', userData.academic_id)
        .order('semester_number', { ascending: true });

      if (semestersError) {
        throw new Error('Failed to fetch semesters');
      }

      if (!semestersData || semestersData.length === 0) {
        setCourses([]);
        return;
      }

      // Get all courses from all semesters
      const semesterIds = semestersData.map(s => s.semester_id);
      
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('semester_id', semesterIds)
        .order('created_at', { ascending: true });

      if (coursesError) {
        throw new Error('Failed to fetch courses');
      }

      // Merge course data with semester info
      const coursesWithSemester = (coursesData || []).map(course => {
        const semester = semestersData.find(s => s.semester_id === course.semester_id);
        return {
          ...course,
          semester_number: semester?.semester_number || 0
        };
      });

      setCourses(coursesWithSemester);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
      console.error('Error fetching all courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshCourses = async () => {
    await fetchAllCourses();
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  return {
    courses,
    loading,
    error,
    refreshCourses,
  };
}; 