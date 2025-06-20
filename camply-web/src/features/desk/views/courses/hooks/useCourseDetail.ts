import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Course, UpdateCourseData } from '../types';

export const useCourseDetail = (courseId: string | undefined) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseDetail = async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching course with ID:', courseId); // Debug log

      // First get user's academic details to verify ownership
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('academic_id')
        .eq('user_id', user.id)
        .single();

      if (userDataError || !userData?.academic_id) {
        throw new Error('Academic details not found');
      }

      // Get the course directly
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (courseError) {
        console.error('Course query error:', courseError);
        throw new Error('Course not found');
      }

      if (!courseData) {
        throw new Error('Course not found');
      }

      console.log('Found course:', courseData); // Debug log

      // Get semester info to verify ownership and get semester number
      const { data: semesterData, error: semesterError } = await supabase
        .from('semesters')
        .select('semester_number, academic_id')
        .eq('semester_id', courseData.semester_id)
        .eq('academic_id', userData.academic_id)
        .single();

      if (semesterError || !semesterData) {
        console.error('Semester query error:', semesterError);
        throw new Error('Course not found or access denied');
      }

      console.log('Found semester:', semesterData); // Debug log

      // Transform the data to match our Course interface
      const courseWithSemester: Course = {
        ...courseData,
        semester_number: semesterData.semester_number
      };

      setCourse(courseWithSemester);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course');
      console.error('Error fetching course detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (updateData: UpdateCourseData) => {
    if (!courseId || !course) {
      return { data: null, error: 'Course not found' };
    }

    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('courses')
        .update({
          course_name: updateData.course_name?.trim(),
          course_code: updateData.course_code?.trim() || null,
          credits: updateData.credits || null,
        })
        .eq('course_id', courseId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setCourse(prev => prev ? { ...prev, ...data } : null);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseDetail();
    }
  }, [courseId]);

  return {
    course,
    loading,
    error,
    updateCourse,
    refreshCourse: fetchCourseDetail,
  };
}; 