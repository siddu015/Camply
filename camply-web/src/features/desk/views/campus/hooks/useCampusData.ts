import { useState, useEffect } from 'react';
import type { User, UserAcademicDetails, College } from '../../../../../types/database';
import { getUserCampusData } from '../../../../../lib/database';

interface CampusData {
  user: User | null;
  academicDetails: UserAcademicDetails | null;
  college: College | null;
  currentSemester: number | null;
}

export const useCampusData = (userId: string | undefined) => {
  const [data, setData] = useState<CampusData>({
    user: null,
    academicDetails: null,
    college: null,
    currentSemester: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchCampusData = async () => {
      if (!userId) {
        setLoading(false);
        setInitialized(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const campusData = await getUserCampusData(userId);
        setData(campusData);
      } catch (err) {
        // Hide error from UI by not setting error state
        console.error('Error fetching campus data:', err);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchCampusData();
  }, [userId]);

  return {
    ...data,
    loading,
    error: null, // Always return null for error to prevent error messages
    initialized,
    refetch: () => {
      if (userId) {
        const fetchCampusData = async () => {
          try {
            setLoading(true);
            setError(null);
            const campusData = await getUserCampusData(userId);
            setData(campusData);
          } catch (err) {
            // Hide error from UI by not setting error state
            console.error('Error fetching campus data:', err);
          } finally {
            setLoading(false);
          }
        };
        fetchCampusData();
      }
    },
  };
}; 