import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { CheckCircle, Calendar} from 'lucide-react';
import type { SemesterFormData } from '../../../types';

interface ConfirmationStepProps {
  formData: SemesterFormData;
  validationErrors: Record<string, string>;
  onFieldChange: (name: string, value: any) => void;
  autoFocus?: boolean;
  direction?: 'next' | 'prev' | null;
}

export function ConfirmationStep({ 
  formData, 
  direction 
}: ConfirmationStepProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div 
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6 pb-8"
    >
      <div className="flex items-start gap-6 mb-8">
        <div>
          <h3 className={cn(
            "text-1xl font-semibold",
            isDark ? "text-white" : "text-foreground"
          )}>
            Review your semester details before registering
          </h3>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Complete Semester Overview */}
        <div className={cn(
          "p-6 rounded-xl backdrop-blur-md border",
          isDark 
            ? "bg-white/8 border-white/15" 
            : "bg-white/15 border-white/25"
        )}>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className={cn(
              "h-5 w-5",
              isDark ? "text-white/70" : "text-muted-foreground"
            )} />
            <h4 className={cn(
              "text-lg font-semibold",
              isDark ? "text-white" : "text-foreground"
            )}>
              Semester Schedule Overview
            </h4>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Semester Number */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className={cn(
                "font-medium",
                isDark ? "text-white/90" : "text-foreground"
              )}>
                Semester Number
              </span>
              <span className={cn(
                "font-semibold",
                isDark ? "text-white" : "text-foreground"
              )}>
                {formData.semester_number ? `${formData.semester_number}${getOrdinalSuffix(formData.semester_number)} Semester` : 'Not set'}
              </span>
            </div>

            {/* Semester Starts */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className={cn(
                "font-medium",
                isDark ? "text-white/90" : "text-foreground"
              )}>
                Semester Starts
              </span>
              <span className={cn(
                "font-semibold",
                isDark ? "text-white" : "text-foreground"
              )}>
                {formatDate(formData.start_date)}
              </span>
            </div>

            {/* IA-1 */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className={cn(
                "font-medium",
                isDark ? "text-white/90" : "text-foreground"
              )}>
                Internal Assignment - 1
              </span>
              <span className={cn(
                "font-semibold",
                isDark ? "text-white" : "text-foreground"
              )}>
                {formatDate(formData.ia1_date)}
              </span>
            </div>

            {/* IA-2 */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className={cn(
                "font-medium",
                isDark ? "text-white/90" : "text-foreground"
              )}>
                Internal Assignment - 2
              </span>
              <span className={cn(
                "font-semibold",
                isDark ? "text-white" : "text-foreground"
              )}>
                {formatDate(formData.ia2_date)}
              </span>
            </div>

            {/* Semester End Exam */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className={cn(
                "font-medium",
                isDark ? "text-white/90" : "text-foreground"
              )}>
                Semester End Exam
              </span>
              <span className={cn(
                "font-semibold",
                isDark ? "text-white" : "text-foreground"
              )}>
                {formatDate(formData.sem_exam_date)}
              </span>
            </div>

            {/* Semester Ends */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className={cn(
                "font-medium",
                isDark ? "text-white/90" : "text-foreground"
              )}>
                Semester Ends
              </span>
              <span className={cn(
                "font-semibold",
                isDark ? "text-white" : "text-foreground"
              )}>
                {formatDate(formData.end_date)}
              </span>
            </div>
          </div>

          {/* Summary Note */}
          <div className={cn(
            "mt-6 p-4 rounded-lg border",
            isDark 
              ? "bg-green-500/10 border-green-500/20 text-green-300" 
              : "bg-green-500/10 border-green-500/20 text-green-700"
          )}>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Ready to Register</p>
                <p className="text-sm opacity-90">
                  All semester details have been validated and are ready for registration. 
                  Click "Complete Registration" to save your semester schedule.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j == 1 && k != 11) {
    return "st";
  }
  if (j == 2 && k != 12) {
    return "nd";
  }
  if (j == 3 && k != 13) {
    return "rd";
  }
  return "th";
} 