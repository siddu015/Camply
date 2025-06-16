import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { checkUserStatus, createUserWithAcademicDetails, updateUserAcademicDetails } from '../lib/database';
import type { UserStatus, UserFormData, User, UserAcademicDetails } from '../types/database';

const USER_STATUS_CACHE_KEY = 'camply_user_status';

export const useUserData = (session: Session | null) => {
  const [userStatus, setUserStatus] = useState<UserStatus>({ exists: false, hasAcademicDetails: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const cached = localStorage.getItem(`${USER_STATUS_CACHE_KEY}_${session.user.id}`);
      if (cached) {
        try {
          const cachedStatus = JSON.parse(cached);
          setUserStatus(cachedStatus);
        } catch (err) {
          console.error('Failed to parse cached user status:', err);
        }
      }
    }
  }, [session?.user?.id]);

  const checkUser = async () => {
    if (!session?.user) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const status = await checkUserStatus(session.user.id);
      setUserStatus(status);
      
      localStorage.setItem(`${USER_STATUS_CACHE_KEY}_${session.user.id}`, JSON.stringify(status));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check user status';
      setError(errorMessage);
      
      const cached = localStorage.getItem(`${USER_STATUS_CACHE_KEY}_${session.user.id}`);
      if (cached) {
        try {
          const cachedStatus = JSON.parse(cached);
          setUserStatus(cachedStatus);
          console.warn('Using cached user status due to network error:', errorMessage);
        } catch (parseErr) {
          console.error('Failed to parse cached user status:', parseErr);
        }
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const saveUserData = async (formData: UserFormData): Promise<{ user: User; academicDetails: UserAcademicDetails }> => {
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    try {
      setLoading(true);
      setError(null);

      let result;
      if (userStatus.exists && userStatus.hasAcademicDetails) {
        result = await updateUserAcademicDetails(session.user.id, formData);
      } else {
        result = await createUserWithAcademicDetails(
          session.user.id,
          session.user.email!,
          formData
        );
      }

      const newStatus = {
        exists: true,
        hasAcademicDetails: true,
        userData: result.user,
        academicDetails: result.academicDetails
      };
      
      setUserStatus(newStatus);
                      
      localStorage.setItem(`${USER_STATUS_CACHE_KEY}_${session.user.id}`, JSON.stringify(newStatus));
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save user data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, [session?.user?.id]);

  return {
    userStatus,
    loading,
    error,
    initialized,
    saveUserData,
    refreshUser: checkUser
  };
}; 