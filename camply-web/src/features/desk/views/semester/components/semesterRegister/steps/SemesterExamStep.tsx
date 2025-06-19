import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
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

  const handleSemEndDateChange = (field: 'start' | 'end', value: string) => {
    const newSemEndDates = {
      ...formData.sem_end_dates,
      [field]: value
    };
    onFieldChange('sem_end_dates', newSemEndDates);
  };

  // Calculate min/max dates for validation
  const getMinStartDate = () => {
    return formData.ia_dates[1]?.start || '';
  };

  const getMaxDate = () => {
    return formData.end_date || '';
  };

  const getMinEndDate = () => {
    if (!formData.sem_end_dates.start) return '';
    const startDate = new Date(formData.sem_end_dates.start);
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
            isDark ? "text-white" : "text-foreground"
          )}>
            When are your semester end exams?
          </h3>
        </div>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        {/* Semester End Exam Start Date */}
        <div className="space-y-3">
          <label className={cn(
            "block text-sm font-medium",
            isDark ? "text-white/90" : "text-muted-foreground"
          )}>
            Semester End Examination Starts *
          </label>
          <input
            ref={firstInputRef}
            type="date"
            value={formData.sem_end_dates.start || ''}
            onChange={(e) => handleSemEndDateChange('start', e.target.value)}
            min={getMinStartDate()}
            max={getMaxDate()}
            className={cn(
              "w-full px-4 py-3 rounded-xl transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "shadow-lg",
              validationErrors.sem_end_start
                ? isDark
                  ? "backdrop-blur-lg bg-white/8 border border-red-400/60 text-white focus:border-red-400 focus:ring-red-400/30"
                  : "backdrop-blur-lg bg-black/5 border border-red-500/60 text-gray-900 focus:border-red-500 focus:ring-red-500/30"
                : isDark
                  ? "backdrop-blur-lg bg-white/8 border border-white/25 text-white focus:border-white/40 focus:ring-white/20 hover:bg-white/10"
                  : "backdrop-blur-lg bg-black/5 border border-black/10 text-gray-900 focus:border-black/20 focus:ring-black/10 hover:bg-black/10"
            )}
          />
          {validationErrors.sem_end_start && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive font-medium"
            >
              {validationErrors.sem_end_start}
            </motion.p>
          )}
        </div>

        {/* Semester End Exam End Date */}
        <div className="space-y-3">
          <label className={cn(
            "block text-sm font-medium",
            isDark ? "text-white/90" : "text-muted-foreground"
          )}>
            Semester End Examination Ends *
          </label>
          <input
            type="date"
            value={formData.sem_end_dates.end || ''}
            onChange={(e) => handleSemEndDateChange('end', e.target.value)}
            min={getMinEndDate()}
            max={getMaxDate()}
            className={cn(
              "w-full px-4 py-3 rounded-xl transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "shadow-lg",
              validationErrors.sem_end_end
                ? isDark
                  ? "backdrop-blur-lg bg-white/8 border border-red-400/60 text-white focus:border-red-400 focus:ring-red-400/30"
                  : "backdrop-blur-lg bg-black/5 border border-red-500/60 text-gray-900 focus:border-red-500 focus:ring-red-500/30"
                : isDark
                  ? "backdrop-blur-lg bg-white/8 border border-white/25 text-white focus:border-white/40 focus:ring-white/20 hover:bg-white/10"
                  : "backdrop-blur-lg bg-black/5 border border-black/10 text-gray-900 focus:border-black/20 focus:ring-black/10 hover:bg-black/10"
            )}
          />
          {validationErrors.sem_end_end && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive font-medium"
            >
              {validationErrors.sem_end_end}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
} 