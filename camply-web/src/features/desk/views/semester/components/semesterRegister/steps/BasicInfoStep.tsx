import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { SemesterFormData } from '../../../types';

interface BasicInfoStepProps {
  formData: SemesterFormData;
  validationErrors: Record<string, string>;
  onFieldChange: (name: string, value: any) => void;
  autoFocus?: boolean;
  direction?: 'next' | 'prev' | null;
}

export function BasicInfoStep({ 
  formData, 
  validationErrors, 
  onFieldChange, 
  autoFocus = false, 
  direction 
}: BasicInfoStepProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const inputRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
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

  const semesterOptions = [
    { value: 1, label: '1st Semester' },
    { value: 2, label: '2nd Semester' },
    { value: 3, label: '3rd Semester' },
    { value: 4, label: '4th Semester' },
    { value: 5, label: '5th Semester' },
    { value: 6, label: '6th Semester' },
    { value: 7, label: '7th Semester' },
    { value: 8, label: '8th Semester' }
  ];

  return (
    <motion.div 
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-start gap-6 mb-10">
        <div>
          <h3 className={cn(
            "text-1xl font-semibold",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Which semester are you registering for?
          </h3>
        </div>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-3 relative">
          <label className={cn(
            "block text-sm font-medium",
            isDark ? "text-white/90" : "text-gray-800"
          )}>
            Semester Number *
          </label>
          
          <select
            ref={inputRef}
            value={formData.semester_number || ''}
            onChange={(e) => onFieldChange('semester_number', parseInt(e.target.value) || 1)}
            className={cn(
              "w-full px-4 py-4 rounded-xl transition-all duration-300 appearance-none",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "shadow-lg",
              validationErrors.semester_number
                ? isDark
                  ? "backdrop-blur-lg bg-white/8 border border-red-400/60 text-white focus:border-red-400 focus:ring-red-400/30"
                  : "backdrop-blur-lg bg-black/5 border border-red-500/60 text-gray-900 focus:border-red-500 focus:ring-red-500/30"
                : isDark
                  ? "backdrop-blur-lg bg-white/8 border border-white/25 text-white focus:border-white/40 focus:ring-white/20 hover:bg-white/10"
                  : "backdrop-blur-lg bg-black/5 border border-black/10 text-gray-900 focus:border-black/20 focus:ring-black/10 hover:bg-black/10"
            )}
          >
            <option value="" disabled>Select Semester</option>
            {semesterOptions.map((option) => (
              <option key={option.value} value={option.value} className={isDark ? "bg-gray-800 text-white" : "bg-white text-black"}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className={cn(
            "absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none mt-3",
            isDark ? "text-white/50" : "text-gray-600"
          )} />

          {validationErrors.semester_number && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-sm mt-2 font-medium",
                isDark ? "text-red-300" : "text-red-700"
              )}
            >
              {validationErrors.semester_number}
            </motion.p>
          )}
        </div>


      </div>
    </motion.div>
  );
} 