import { useState, useEffect, useCallback } from 'react';
import { checkUserSemester, createSemester } from '../lib';
import type { Semester, SemesterFormData, SemesterStatus } from '../types';

export const useSemesterData = (userId: string | undefined) => {
  const [semesterStatus, setSemesterStatus] = useState<SemesterStatus>({
    hasSemester: false,
    currentSemester: null,
    loading: true,
    error: null
  });

  const checkSemester = useCallback(async () => {
    if (!userId) {
      setSemesterStatus({
        hasSemester: false,
        currentSemester: null,
        loading: false,
        error: null
      });
      return;
    }

    setSemesterStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await checkUserSemester(userId);
      setSemesterStatus({
        hasSemester: result.hasSemester,
        currentSemester: result.currentSemester,
        loading: false,
        error: null
      });
    } catch (error) {
      setSemesterStatus({
        hasSemester: false,
        currentSemester: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error checking semester'
      });
    }
  }, [userId]);

  const registerSemester = useCallback(async (formData: SemesterFormData): Promise<Semester> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const newSemester = await createSemester(userId, formData);
      
      // Refresh semester status
      await checkSemester();
      
      return newSemester;
    } catch (error) {
      console.error('Error registering semester:', error);
      throw error;
    }
  }, [userId, checkSemester]);

  const refreshSemester = useCallback(async () => {
    await checkSemester();
  }, [checkSemester]);

  useEffect(() => {
    checkSemester();
  }, [checkSemester]);

  return {
    ...semesterStatus,
    registerSemester,
    refreshSemester
  };
}; 