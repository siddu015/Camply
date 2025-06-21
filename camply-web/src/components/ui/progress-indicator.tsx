import { motion } from "framer-motion";
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  variant?: 'default' | 'modern' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showStepText?: boolean;
  className?: string;
  barClassName?: string;
}

export function ProgressIndicator({ 
  currentStep, 
  totalSteps,
  variant = 'default',
  size = 'md',
  showPercentage = true,
  showStepText = true,
  className,
  barClassName
}: ProgressIndicatorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const progressPercentage = Math.round(((currentStep + 1) / totalSteps) * 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-1 sm:h-1.5',
    lg: 'h-2'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm sm:text-base'
  };
  
  const getTextColor = () => {
    if (variant === 'modern') {
      return isDark ? 'text-white/70' : 'text-muted-foreground';
    }
    if (variant === 'minimal') {
      return 'text-muted-foreground';
    }
    return 'text-white/70';
  };

  const getBackgroundColor = () => {
    if (variant === 'modern') {
      return isDark ? 'bg-white/10' : 'bg-muted';
    }
    if (variant === 'minimal') {
      return 'bg-muted';
    }
    return 'bg-white/10';
  };

  const getProgressGradient = () => {
    if (variant === 'minimal') {
      return 'bg-primary';
    }
    return 'bg-gradient-to-r from-cyan-400 to-blue-500';
  };

  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      {(showStepText || showPercentage) && (
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          {showStepText && (
            <span className={cn(
              textSizeClasses[size],
              'font-medium',
              getTextColor()
            )}>
              Step {currentStep + 1} of {totalSteps}
            </span>
          )}
          {showPercentage && (
            <span className={cn(
              textSizeClasses[size],
              'font-medium',
              getTextColor()
            )}>
              {progressPercentage}% complete
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        'w-full rounded-full',
        sizeClasses[size],
        getBackgroundColor(),
        barClassName
      )}>
        <motion.div 
          className={cn(
            sizeClasses[size],
            'rounded-full',
            getProgressGradient()
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
} 