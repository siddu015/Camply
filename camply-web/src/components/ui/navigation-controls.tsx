import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';

interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isValidating: boolean;
  loading?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  variant?: 'default' | 'modern' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  submitText?: string;
  nextText?: string;
  prevText?: string;
  className?: string;
}

export function NavigationControls({
  currentStep,
  totalSteps,
  canProceed,
  isValidating,
  loading = false,
  onNext,
  onPrev,
  onSubmit,
  variant = 'default',
  size = 'md',
  submitText = 'Complete Registration',
  nextText = 'Next',
  prevText = 'Previous',
  className
}: NavigationControlsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isProcessing = isValidating || loading;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const IconLeft = variant === 'modern' ? ArrowLeft : ChevronLeft;
  const IconRight = variant === 'modern' ? ArrowRight : ChevronRight;

  const getButtonClasses = (type: 'prev' | 'next' | 'submit', disabled: boolean) => {
    const baseClasses = cn(
      'flex items-center gap-2 rounded-xl transition-all duration-300 font-medium',
      sizeClasses[size],
      disabled && 'opacity-50 cursor-not-allowed'
    );

    if (variant === 'modern') {
      return cn(
        baseClasses,
        'backdrop-blur-md border shadow-lg',
        disabled
          ? 'bg-white/5 border-white/10 text-white/50'
          : type === 'prev'
            ? isDark
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30 hover:scale-105'
              : 'bg-white/15 border-white/25 text-foreground hover:bg-white/20 hover:border-white/35 hover:scale-105'
            : type === 'submit'
              ? 'bg-accent hover:bg-accent/80 border-accent/30 text-accent-foreground hover:scale-105 font-semibold'
              : 'bg-primary hover:bg-primary/80 border-primary/30 text-primary-foreground hover:scale-105'
      );
    }

    if (variant === 'minimal') {
      return cn(
        baseClasses,
        'border border-border',
        disabled
          ? 'bg-muted text-muted-foreground'
          : type === 'prev'
            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            : type === 'submit'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
      );
    }

    return cn(
      baseClasses,
      'touch-target w-full sm:w-auto',
      type === 'prev'
        ? disabled
          ? 'opacity-0 pointer-events-none'
          : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white'
        : disabled
          ? 'bg-muted text-muted-foreground'
          : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl font-semibold'
    );
  };

  const layoutClasses = variant === 'default' 
    ? 'flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-0'
    : 'flex items-center justify-between gap-4';

  return (
    <div className={cn(layoutClasses, className)}>
      {/* Previous Button */}
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstStep || isProcessing}
        className={getButtonClasses('prev', isFirstStep || isProcessing)}
      >
        <IconLeft className="h-4 w-4" />
        <span>{variant === 'default' ? 'Back' : prevText}</span>
      </button>
                                
      {variant === 'modern' && <div />}

      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canProceed || isProcessing}
          className={getButtonClasses('submit', !canProceed || isProcessing)}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>{isValidating ? 'Validating...' : 'Processing...'}</span>
            </>
          ) : (
            <span>{submitText}</span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || isProcessing}
          className={getButtonClasses('next', !canProceed || isProcessing)}
        >
          <span>{nextText}</span>
          <IconRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
} 