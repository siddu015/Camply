import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import type { SemesterFormData, IADate } from '../../../types';

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

  // Ensure IA dates have fixed names
  useEffect(() => {
    const updatedIADates = [
      { name: 'Internal Assignment - 1', start: formData.ia_dates[0]?.start || '', end: '' },
      { name: 'Internal Assignment - 2', start: formData.ia_dates[1]?.start || '', end: '' }
    ];
    
    // Only update if names are different
    if (formData.ia_dates[0]?.name !== 'Internal Assignment - 1' || 
        formData.ia_dates[1]?.name !== 'Internal Assignment - 2') {
      onFieldChange('ia_dates', updatedIADates);
    }
  }, []);

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

  const handleIADateChange = (index: number, value: string) => {
    const newIADates = formData.ia_dates.map((ia, i) => 
      i === index ? { ...ia, start: value } : ia
    );
    // Trigger validation for the entire ia_dates array to validate cross-dependencies
    onFieldChange('ia_dates', newIADates);
  };

  // Calculate min/max dates for validation
  const getMinDate = (index: number) => {
    if (index === 0) {
      return formData.start_date || '';
    } else {
      return formData.ia_dates[0]?.start || formData.start_date || '';
    }
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
        {/* Internal Assignment 1 */}
        <div className="space-y-3">
          <label className={cn(
            "block text-sm font-medium",
            isDark ? "text-white/90" : "text-muted-foreground"
          )}>
            Internal Assignment-1 *
          </label>
          <input
            ref={firstInputRef}
            type="date"
            value={formData.ia_dates[0]?.start || ''}
            onChange={(e) => handleIADateChange(0, e.target.value)}
            min={getMinDate(0)}
            max={getMaxDate()}
            className={cn(
              "w-full px-4 py-3 rounded-xl transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "shadow-lg backdrop-blur-lg border",
              validationErrors.ia_0_start
                ? isDark
                  ? "bg-white/8 border-red-400/60 text-white focus:border-red-400 focus:ring-red-400/30"
                  : "bg-background border-red-500/60 text-foreground focus:border-red-500 focus:ring-red-500/30"
                : isDark
                  ? "bg-white/8 border-white/25 text-white focus:border-white/40 focus:ring-white/20 hover:bg-white/10"
                  : "bg-background border-border text-foreground focus:border-ring focus:ring-ring/20 hover:bg-muted/50"
            )}
          />
          {validationErrors.ia_0_start && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive font-medium"
            >
              {validationErrors.ia_0_start}
            </motion.p>
          )}
        </div>

        {/* Internal Assignment 2 */}
        <div className="space-y-3">
          <label className={cn(
            "block text-sm font-medium",
            isDark ? "text-white/90" : "text-muted-foreground"
          )}>
            Internal Assignment-2 *
          </label>
          <input
            type="date"
            value={formData.ia_dates[1]?.start || ''}
            onChange={(e) => handleIADateChange(1, e.target.value)}
            min={getMinDate(1)}
            max={getMaxDate()}
            className={cn(
              "w-full px-4 py-3 rounded-xl transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "shadow-lg backdrop-blur-lg border",
              validationErrors.ia_1_start
                ? isDark
                  ? "bg-white/8 border-red-400/60 text-white focus:border-red-400 focus:ring-red-400/30"
                  : "bg-background border-red-500/60 text-foreground focus:border-red-500 focus:ring-red-500/30"
                : isDark
                  ? "bg-white/8 border-white/25 text-white focus:border-white/40 focus:ring-white/20 hover:bg-white/10"
                  : "bg-background border-border text-foreground focus:border-ring focus:ring-ring/20 hover:bg-muted/50"
            )}
          />
          {validationErrors.ia_1_start && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive font-medium"
            >
              {validationErrors.ia_1_start}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
} 