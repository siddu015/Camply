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
        {/* Semester End Exam Date */}
        <div className="space-y-3">
          <label className={cn(
            "block text-sm font-medium",
            isDark ? "text-white/90" : "text-muted-foreground"
          )}>
            Semester End Examination Date *
          </label>
          <input
            ref={firstInputRef}
            type="date"
            value={formData.sem_exam_date || ''}
            onChange={(e) => handleSemExamDateChange(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className={cn(
              "w-full px-4 py-3 rounded-xl transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "shadow-lg",
              validationErrors.sem_exam_date
                ? isDark
                  ? "backdrop-blur-lg bg-white/8 border border-red-400/60 text-white focus:border-red-400 focus:ring-red-400/30"
                  : "backdrop-blur-lg bg-black/5 border border-red-500/60 text-gray-900 focus:border-red-500 focus:ring-red-500/30"
                : isDark
                  ? "backdrop-blur-lg bg-white/8 border border-white/25 text-white focus:border-white/40 focus:ring-white/20 hover:bg-white/10"
                  : "backdrop-blur-lg bg-black/5 border border-black/10 text-gray-900 focus:border-black/20 focus:ring-black/10 hover:bg-black/10"
            )}
          />
          {validationErrors.sem_exam_date && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive font-medium"
            >
              {validationErrors.sem_exam_date}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
} 