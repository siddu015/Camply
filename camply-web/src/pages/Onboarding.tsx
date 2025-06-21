import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { useUserData } from '@/hooks/useUserData';
import AcademicDetailsForm from '@/features/academic-form';
import { SimpleLoader } from '@/components';
import type { UserFormData } from '@/types/database';

interface OnboardingProps {
  session: Session;
  onOnboardingComplete?: () => void;
}

const Onboarding = ({ session, onOnboardingComplete }: OnboardingProps) => {
  const navigate = useNavigate();
  const { userStatus, loading, error, initialized, saveUserData } = useUserData(session);

  const handleFormSubmit = async (formData: UserFormData) => {
    try {
      await saveUserData(formData);
      
      if (onOnboardingComplete) {
        await onOnboardingComplete();
      }
      
    } catch (err) {
      console.error('Failed to save user data:', err);
    }
  };

  if (loading || !initialized) {
    return <SimpleLoader />;
  }

  if (userStatus.exists && userStatus.hasAcademicDetails) {
    navigate('/desk');
    return null;
  }

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
