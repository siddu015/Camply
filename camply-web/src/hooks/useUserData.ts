import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { checkUserStatus, createUserWithAcademicDetails, updateUserAcademicDetails } from '../lib/database';
import type { UserStatus, UserFormData, User, UserAcademicDetails } from '../types/database';

export const useUserData = (session: Session | null) => {
  const [userStatus, setUserStatus] = useState<UserStatus>({ exists: false, hasAcademicDetails: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUser = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const status = await checkUserStatus(session.user.id);
      setUserStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check user status');
    } finally {
      setLoading(false);
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
        // Update existing user
        result = await updateUserAcademicDetails(session.user.id, formData);
      } else {
        // Create new user with academic details
        result = await createUserWithAcademicDetails(
          session.user.id,
          session.user.email!,
          formData
        );
      }

      // Refresh user status
      await checkUser();
      
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
    saveUserData,
    refreshUser: checkUser
  };
}; 