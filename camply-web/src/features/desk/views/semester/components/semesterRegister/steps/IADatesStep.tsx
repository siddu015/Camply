import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { GlassDatePicker } from '@/components/ui';
import type { SemesterFormData } from '../../../types';

interface IADatesStepProps {
  formData: SemesterFormData;
  validationErrors: Record<string, string>;
  onFieldChange: (name: string, value: any) => void;
  autoFocus?: boolean;
  direction?: 'next' | 'prev' | null;
}

export function IADatesStep({ 
  formData, 
  validationErrors, 
  onFieldChange, 
  autoFocus = false, 
  direction 
}: IADatesStepProps) {
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

  const handleIA1DateChange = (value: string) => {
    onFieldChange('ia1_date', value);
  };

  const handleIA2DateChange = (value: string) => {
    onFieldChange('ia2_date', value);
  };

  const getMinDateIA1 = () => {
    return formData.start_date || '';
  };

  const getMinDateIA2 = () => {
    return formData.ia1_date || formData.start_date || '';
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
            isDark ? "text-white" : "text-gray-900"
          )}>
            When are your Internal Assessments scheduled?
          </h3>
        </div>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-3">
          <GlassDatePicker
            label="Internal Assignment-1"
            value={formData.ia1_date || ''}
            onChange={handleIA1DateChange}
            placeholder="Select IA-1 date"
            error={validationErrors.ia1_date}
            min={getMinDateIA1()}
            max={getMaxDate()}
            required
          />
        </div>

        <div className="space-y-3">
          <GlassDatePicker
            label="Internal Assignment-2"
            value={formData.ia2_date || ''}
            onChange={handleIA2DateChange}
            placeholder="Select IA-2 date"
            error={validationErrors.ia2_date}
            min={getMinDateIA2()}
            max={getMaxDate()}
            required
          />
        </div>
      </div>
    </motion.div>
  );
} 