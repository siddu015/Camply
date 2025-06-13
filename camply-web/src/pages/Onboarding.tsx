import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { useUserData } from '../hooks/useUserData';
import AcademicDetailsForm from '../features/academic-form';
import type { UserFormData } from '../types/database';

interface OnboardingProps {
  session: Session;
  onOnboardingComplete?: () => void;
}

const Onboarding = ({ session, onOnboardingComplete }: OnboardingProps) => {
  const navigate = useNavigate();
  const { userStatus, loading, error, saveUserData, refreshUser } = useUserData(session);

  const handleFormSubmit = async (formData: UserFormData) => {
    try {
      await saveUserData(formData);
      
      // Notify parent component to refresh its user data
      if (onOnboardingComplete) {
        await onOnboardingComplete();
      }
      
      // Navigate will happen automatically due to user status change
    } catch (err) {
      console.error('Failed to save user data:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If user exists and has academic details, redirect to home
  if (userStatus.exists && userStatus.hasAcademicDetails) {
    navigate('/desk');
    return null;
  }

  // Only show error if it's not a network error or if user definitely needs onboarding
  const shouldShowError = error && (!error.includes('Failed to check user status') || (!userStatus.exists && !userStatus.hasAcademicDetails));

  return (
    <AcademicDetailsForm
      onSubmit={handleFormSubmit}
      loading={loading}
      error={shouldShowError ? error : null}
      initialData={userStatus.userData ? {
        name: userStatus.userData.name,
        phone_number: userStatus.userData.phone_number || ''
      } : undefined}
    />
  );
};

export default Onboarding; 