import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { useUserData } from '../hooks/useUserData';
import AcademicDetailsForm from '../components/academic-form';
import type { UserFormData } from '../types/database';

interface OnboardingProps {
  session: Session;
}

const Onboarding = ({ session }: OnboardingProps) => {
  const navigate = useNavigate();
  const { userStatus, loading, error, saveUserData } = useUserData(session);

  const handleFormSubmit = async (formData: UserFormData) => {
    try {
      await saveUserData(formData);
      navigate('/home');
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
    navigate('/home');
    return null;
  }

  return (
    <AcademicDetailsForm
      onSubmit={handleFormSubmit}
      loading={loading}
      error={error}
      initialData={userStatus.userData ? {
        name: userStatus.userData.name,
        phone_number: userStatus.userData.phone_number || ''
      } : undefined}
    />
  );
};

export default Onboarding; 