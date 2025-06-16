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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampusData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const campusData = await getUserCampusData(userId);
        setData(campusData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch campus data');
        console.error('Error fetching campus data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampusData();
  }, [userId]);

  return {
    ...data,
    loading,
    error,
    refetch: () => {
      if (userId) {
        const fetchCampusData = async () => {
          try {
            setLoading(true);
            setError(null);
            const campusData = await getUserCampusData(userId);
            setData(campusData);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch campus data');
          } finally {
            setLoading(false);
          }
        };
        fetchCampusData();
      }
    },
  };
}; 