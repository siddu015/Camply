import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { GlassDatePicker } from '@/components/ui';
import type { SemesterFormData } from '../../../types';

interface SemesterDatesStepProps {
  formData: SemesterFormData;
  validationErrors: Record<string, string>;
  onFieldChange: (name: string, value: any) => void;
  autoFocus?: boolean;
  direction?: 'next' | 'prev' | null;
}

export function SemesterDatesStep({ 
  formData, 
  validationErrors, 
  onFieldChange, 
  autoFocus = false, 
  direction 
}: SemesterDatesStepProps) {
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

  const getMinEndDate = () => {
    if (!formData.start_date) return '';
    const startDate = new Date(formData.start_date);
    startDate.setDate(startDate.getDate() + 1);
    return startDate.toISOString().split('T')[0];
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
            isDark ? "text-white" : "text-gray-900"
          )}>
            When does your semester start and end?
          </h3>
        </div>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-3">
          <GlassDatePicker
            label="Semester Start Date"
            value={formData.start_date || ''}
            onChange={(date) => onFieldChange('start_date', date)}
            placeholder="Select start date"
            error={validationErrors.start_date}
            required
          />
        </div>

        <div className="space-y-3">
          <GlassDatePicker
            label="Semester End Date"
            value={formData.end_date || ''}
            onChange={(date) => onFieldChange('end_date', date)}
            placeholder="Select end date"
            error={validationErrors.end_date}
            min={getMinEndDate()}
            required
          />
        </div>
      </div>
    </motion.div>
  );
} 