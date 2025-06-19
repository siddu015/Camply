import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { Calendar, X } from 'lucide-react';
import type { SemesterFormData } from '../types';

import { 
  BasicInfoStep,
  SemesterDatesStep,
  IADatesStep, 
  SemesterExamStep,
  ConfirmationStep
} from './semesterRegister/steps';
import { SemesterProgressIndicator } from './semesterRegister/SemesterProgressIndicator';
import { SemesterNavigationControls } from './semesterRegister/SemesterNavigationControls';
import { useSemesterFormValidation } from '../hooks/useSemesterFormValidation';

interface SemesterRegistrationFormProps {
  onSubmit: (data: SemesterFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const TOTAL_STEPS = 5;

export function SemesterRegistrationForm({ onSubmit, onCancel, loading }: SemesterRegistrationFormProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [navigationDirection, setNavigationDirection] = useState<'next' | 'prev' | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<SemesterFormData>({
    semester_number: 1,
    start_date: '',
    end_date: '',
    ia1_date: '',
    ia2_date: '',
    sem_exam_date: ''
  });

  const { validateField, canProceedFromStep } = useSemesterFormValidation(formData);

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
    
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    // Clear relevant validation errors based on field name
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    validationTimeoutRef.current = setTimeout(() => {
      const fieldErrors = validateField(name, value);
      
      setValidationErrors(prev => {
        const hasChanges = Object.keys(fieldErrors).length > 0 || prev[name];
        if (!hasChanges) return prev;
        
        return {
          ...prev,
          ...fieldErrors
        };
      });
    }, 300);
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
        return <BasicInfoStep {...stepProps} />;
      case 1:
        return <SemesterDatesStep {...stepProps} />;
      case 2:
        return <IADatesStep {...stepProps} />;
      case 3:
        return <SemesterExamStep {...stepProps} />;
      case 4:
        return <ConfirmationStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className={cn(
          "fixed inset-0 z-40 backdrop-blur-[3px]",
          isDark ? "bg-black/40" : "bg-gray-500/50"
        )}
      />
      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4"
        )}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          <div 
            className={cn(
              "rounded-2xl overflow-hidden flex flex-col relative",
              isDark 
                ? "backdrop-blur-[40px] bg-gradient-to-br from-white/12 via-white/6 to-white/3" 
                : "backdrop-blur-[60px] bg-gradient-to-br from-white/8 via-white/4 to-white/2",
              isDark
                ? "border border-white/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.6)]"
                : "border border-white/20 shadow-[inset_0_2px_6px_rgba(255,255,255,0.5),0_12px_40px_rgba(0,0,0,0.15)]",
              "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none",
              isDark
                ? "before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-white/8"
                : "before:bg-gradient-to-br before:from-white/12 before:via-white/4 before:to-white/6",
              "after:absolute after:inset-[1px] after:rounded-2xl after:pointer-events-none",
              isDark
                ? "after:bg-gradient-to-t after:from-transparent after:via-white/4 after:to-white/12"
                : "after:bg-gradient-to-t after:from-white/2 after:via-white/5 after:to-white/8",
              "[&>*]:relative [&>*]:z-10"
            )}
          >
            
            {/* Header */}
            <div className={cn(
              "flex items-center justify-between p-6 rounded-t-2xl",
              isDark 
                ? "backdrop-blur-[25px] bg-gradient-to-r from-white/8 to-white/4 border-b border-white/20" 
                : "backdrop-blur-[30px] bg-gradient-to-r from-white/12 to-white/6 border-b border-white/25",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
            )}>
              <div className="flex items-center gap-3">
                <div>
                  <h2 className={cn(
                    "text-2xl font-bold drop-shadow-lg",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Semester Registration
                  </h2>
                </div>
              </div>
              
              <button
                onClick={onCancel}
                className={cn(
                  "p-2 rounded-lg transition-colors backdrop-blur-md",
                  isDark ? "bg-white/5 border border-white/8" : "bg-white/12 border border-white/20",
                  "hover:bg-red-500/10 hover:border-red-500/20",
                  isDark ? "text-gray-300 hover:text-red-400" : "text-gray-800 hover:text-red-600"
                )}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 py-4">
              <SemesterProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
            </div>

            {/* Content */}
            <div className={cn(
              "flex-1 overflow-y-auto px-6 py-4 flex flex-col max-h-[400px]",
              isDark 
                ? "backdrop-blur-[20px] bg-gradient-to-b from-white/3 to-white/1" 
                : "backdrop-blur-[25px] bg-gradient-to-b from-white/6 to-white/3",
              isDark 
                ? "scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30" 
                : "scrollbar-thin scrollbar-thumb-gray-500/40 scrollbar-track-transparent hover:scrollbar-thumb-gray-600/50"
            )}>
              <div className="mb-8 min-h-[250px] relative">
                <AnimatePresence mode="wait" onExitComplete={() => setNavigationDirection(null)}>
                  <div key={currentStep}>
                    {renderStep()}
                  </div>
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className={cn(
              "p-6 rounded-b-2xl",
              isDark 
                ? "backdrop-blur-[25px] bg-gradient-to-r from-white/8 to-white/4 border-t border-white/20" 
                : "backdrop-blur-[30px] bg-gradient-to-r from-white/12 to-white/6 border-t border-white/25",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            )}>
              <SemesterNavigationControls
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
        </motion.div>
      </div>
    </>
  );
} 