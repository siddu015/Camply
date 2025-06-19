import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Course {
  course_id: string;
  semester_id: string;
  course_name: string;
  course_code: string | null;
  syllabus_storage_path: string | null;
  credits: number | null;
  created_at: string;
  updated_at: string;
}

export interface AddCourseData {
  course_name: string;
  course_code?: string;
  credits?: number;
}

export const useCourses = (semesterId: string | null) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    if (!semesterId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('semester_id', semesterId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setCourses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async (courseData: AddCourseData) => {
    if (!semesterId) {
      throw new Error('Semester ID is required');
    }

    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('courses')
        .insert({
          semester_id: semesterId,
          course_name: courseData.course_name.trim(),
          course_code: courseData.course_code?.trim() || null,
          credits: courseData.credits || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setCourses(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add course';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const deleteCourse = async (courseId: string) => {
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('course_id', courseId);

      if (deleteError) {
        throw deleteError;
      }

      setCourses(prev => prev.filter(course => course.course_id !== courseId));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete course';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const updateCourse = async (courseId: string, updates: Partial<AddCourseData>) => {
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('courses')
        .update({
          ...updates,
          course_name: updates.course_name?.trim(),
          course_code: updates.course_code?.trim() || null,
        })
        .eq('course_id', courseId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setCourses(prev => 
        prev.map(course => 
          course.course_id === courseId ? data : course
        )
      );
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  useEffect(() => {
    if (semesterId) {
      fetchCourses();
    }
  }, [semesterId]);

  return {
    courses,
    loading,
    error,
    addCourse,
    deleteCourse,
    updateCourse,
    refreshCourses: fetchCourses,
  };
}; 