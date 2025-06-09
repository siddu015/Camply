import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from "framer-motion";
import { supabase } from '../../lib/supabase';
import { AuroraBackground } from '../ui/aurora-background';
import { useFormValidation } from './hooks/useFormValidation';
import { ProgressIndicator } from './components/ProgressIndicator';
import { NavigationControls } from './components/NavigationControls';
import {
  NameStep,
  PhoneStep,
  CollegeStep,
  DepartmentStep,
  RollNumberStep,
  YearsStep
} from './components/steps';
import type { 
  AcademicDetailsFormProps,
  AcademicFormData 
} from './types';
import type { College, DepartmentData } from '../../types/database';

const TOTAL_STEPS = 6;

const AcademicDetailsForm = ({ onSubmit, loading, error, initialData }: AcademicDetailsFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [navigationDirection, setNavigationDirection] = useState<'next' | 'prev' | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<DepartmentData>({});
  const [selectedDepartmentCategory, setSelectedDepartmentCategory] = useState<string>('');
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  
  // Add validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<AcademicFormData>({
    name: initialData?.name || '',
    phone_number: initialData?.phone_number ? 
      (initialData.phone_number.startsWith('+91') ? initialData.phone_number : `+91 ${initialData.phone_number}`) 
      : '+91 ',
    college_id: initialData?.college_id || '',
    department_name: initialData?.department_name || '',
    branch_name: initialData?.branch_name || '',
    admission_year: initialData?.admission_year || new Date().getFullYear(),
    graduation_year: initialData?.graduation_year || new Date().getFullYear() + 4,
    roll_number: initialData?.roll_number || ''
  });

  const { validateField, canProceedFromStep } = useFormValidation(formData);

  // Load colleges and departments data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [collegesResponse, departmentsResponse] = await Promise.all([
          supabase.from('colleges').select('college_id, name, city, state, university_name'),
          fetch('/Departments.json')
        ]);

        if (collegesResponse.error) {
          console.error('Error fetching colleges:', collegesResponse.error);
        } else {
          setColleges(collegesResponse.data || []);
        }

        const departmentsData = await departmentsResponse.json();
        setDepartments(departmentsData);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, []);

  // Update available branches when department category changes
  useEffect(() => {
    if (selectedDepartmentCategory && departments[selectedDepartmentCategory]) {
      setAvailableBranches(departments[selectedDepartmentCategory]);
    } else {
      setAvailableBranches([]);
    }
  }, [selectedDepartmentCategory, departments]);

  const checkPhoneNumberExists = async (phoneNumber: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('phone_number')
        .eq('phone_number', phoneNumber)
        .limit(1);
      
      if (error) {
        console.error('Error checking phone number:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (err) {
      console.error('Error checking phone number:', err);
      return false;
    }
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1 && canProceedFromStep(currentStep, validationErrors)) {
      setNavigationDirection('next');
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setNavigationDirection('prev');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setIsValidating(true);
    
    // Check if phone number already exists (only if phone number is provided)
    const phoneDigits = formData.phone_number ? formData.phone_number.replace(/^\+91\s?/, '') : '';
    
    if (phoneDigits && phoneDigits.length === 10) {
      try {
        const phoneExists = await checkPhoneNumberExists(phoneDigits);
        if (phoneExists) {
          setValidationErrors({ phone_number: 'This phone number is already registered. Please use a different number.' });
          setCurrentStep(1); // Go back to phone step
          setIsValidating(false);
          return;
        }
      } catch (err) {
        console.error('Error validating phone number:', err);
      }
    }
    
    const dataToSave = {
      ...formData,
      phone_number: phoneDigits || undefined
    };
    
    try {
      await onSubmit(dataToSave);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    // Clear field-specific error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear previous validation timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Real-time validation for the changed field (debounced)
    validationTimeoutRef.current = setTimeout(() => {
      const fieldErrors = validateField(name, value);
      
      // Only update validation errors if there are actual changes
      setValidationErrors(prev => {
        const hasChanges = Object.keys(fieldErrors).length > 0 || prev[name];
        if (!hasChanges) return prev;
        
        return {
          ...prev,
          ...fieldErrors
        };
      });
    }, 300); // Reduced timeout for better responsiveness
  };

  const handleDepartmentCategoryChange = (category: string) => {
    setSelectedDepartmentCategory(category);
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      validationErrors,
      onFieldChange: handleFieldChange,
      autoFocus: true,
      direction: navigationDirection
    };

    switch (currentStep) {
      case 0:
        return <NameStep {...stepProps} />;
      case 1:
        return <PhoneStep {...stepProps} />;
      case 2:
        return <CollegeStep {...stepProps} colleges={colleges} />;
      case 3:
        return (
          <DepartmentStep
            {...stepProps}
            departments={departments}
            selectedDepartmentCategory={selectedDepartmentCategory}
            availableBranches={availableBranches}
            onDepartmentCategoryChange={handleDepartmentCategoryChange}
          />
        );
      case 4:
        return <RollNumberStep {...stepProps} />;
      case 5:
        return <YearsStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <AuroraBackground>
      <div className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl rounded-lg sm:rounded-xl md:rounded-2xl bg-white/[0.02] backdrop-blur-md p-4 sm:p-6 md:p-8 lg:p-10 shadow-xl border border-white/[0.03] relative overflow-hidden min-h-[400px] sm:min-h-[450px] md:min-h-[500px]">
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-soft-light pointer-events-none" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
               backgroundSize: '100px 100px'
             }}>
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="text-left mb-6 sm:mb-8">
            <h2 className="text-responsive-2xl font-black text-white drop-shadow-lg">
              Welcome to Camply
            </h2>
            <p className="text-left mt-2 sm:mt-3 text-responsive-base text-white/90 drop-shadow-md">
              Let's set up your academic profile
            </p>
          </div>

          {/* Progress Indicator */}
          <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          {error && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg sm:rounded-xl bg-red-500/15 backdrop-blur-sm border border-red-300/20 text-red-100 shadow-lg">
              <p className="text-responsive-sm">{error}</p>
            </div>
          )}

          {/* Step Content - Responsive height container */}
          <div className="mb-6 sm:mb-8 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] relative">
            <AnimatePresence mode="wait" onExitComplete={() => setNavigationDirection(null)}>
              <div key={currentStep}>
                {renderStep()}
              </div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <NavigationControls
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            canProceed={canProceedFromStep(currentStep, validationErrors)}
            isValidating={isValidating}
            loading={loading}
            onNext={nextStep}
            onPrev={prevStep}
            onSubmit={handleFinalSubmit}
          />
        </div>
      </div>
    </AuroraBackground>
  );
};

export default AcademicDetailsForm; 