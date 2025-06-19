import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { GlassDatePicker } from '@/components/ui';
import type { SemesterFormData } from '../../../types';

interface SemesterExamStepProps {
  formData: SemesterFormData;
  validationErrors: Record<string, string>;
  onFieldChange: (name: string, value: any) => void;
  autoFocus?: boolean;
  direction?: 'next' | 'prev' | null;
}

export function SemesterExamStep({ 
  formData, 
  validationErrors, 
  onFieldChange, 
  autoFocus = false, 
  direction 
}: SemesterExamStepProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && firstInputRef.current) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const stepVariants = {
    initial: { 
      opacity: 0, 
      x: direction === 'next' ? 30 : direction === 'prev' ? -30 : 0,
      y: 10
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      y: 0
    },
    exit: { 
      opacity: 0, 
      x: direction === 'next' ? -30 : direction === 'prev' ? 30 : 0,
      y: -10
    }
  };

  const handleSemExamDateChange = (value: string) => {
    onFieldChange('sem_exam_date', value);
  };

  const getMinDate = () => {
    return formData.ia2_date || '';
  };

  const getMaxDate = () => {
    return formData.end_date || '';
  };

  return (
    <motion.div 
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-start gap-6 mb-8">
        <div>
          <h3 className={cn(
            "text-1xl font-semibold",
            isDark ? "text-white" : "text-foreground"
          )}>
            When do your semester end exams start?
          </h3>
        </div>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-3">
          <GlassDatePicker
            label="Semester End Examination Date"
            value={formData.sem_exam_date || ''}
            onChange={handleSemExamDateChange}
            placeholder="Select exam date"
            error={validationErrors.sem_exam_date}
            min={getMinDate()}
            max={getMaxDate()}
            required
          />
        </div>
      </div>
    </motion.div>
  );
} 