import { motion } from "framer-motion";
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';

interface SemesterProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function SemesterProgressIndicator({ currentStep, totalSteps }: SemesterProgressIndicatorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const progressPercentage = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className={cn(
          "text-xs font-medium",
          isDark ? "text-white/70" : "text-muted-foreground"
        )}>
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className={cn(
          "text-xs font-medium",
          isDark ? "text-white/70" : "text-muted-foreground"
        )}>
          {progressPercentage}% complete
        </span>
      </div>
      <div className={cn(
        "w-full rounded-full h-1 sm:h-1.5",
        isDark ? "bg-white/10" : "bg-muted"
      )}>
        <motion.div 
          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 sm:h-1.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
} 