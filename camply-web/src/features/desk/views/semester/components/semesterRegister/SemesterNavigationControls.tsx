import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';

interface SemesterNavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isValidating: boolean;
  loading?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
}

export function SemesterNavigationControls({
  currentStep,
  totalSteps,
  canProceed,
  isValidating,
  loading = false,
  onNext,
  onPrev,
  onSubmit
}: SemesterNavigationControlsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isProcessing = isValidating || loading;

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Previous Button */}
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstStep || isProcessing}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300",
          "backdrop-blur-md border",
          isFirstStep || isProcessing
            ? "opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/50"
            : isDark
              ? "bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30 hover:scale-105"
              : "bg-white/15 border-white/25 text-foreground hover:bg-white/20 hover:border-white/35 hover:scale-105",
          "shadow-lg"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Previous</span>
      </button>

      {/* Empty space for center alignment */}
      <div></div>

      {/* Next/Submit Button */}
      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canProceed || isProcessing}
          className={cn(
            "flex items-center gap-2 px-8 py-3 rounded-xl transition-all duration-300",
            "backdrop-blur-md border font-semibold shadow-lg",
            !canProceed || isProcessing
              ? "opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/50"
              : isDark
                ? "bg-accent hover:bg-accent/80 border-accent/30 text-accent-foreground hover:scale-105"
                : "bg-accent hover:bg-accent/80 border-accent/30 text-accent-foreground hover:scale-105"
          )}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Registering...</span>
            </>
          ) : (
            <>
              <span>Complete Registration</span>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || isProcessing}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300",
            "backdrop-blur-md border font-medium shadow-lg",
            !canProceed || isProcessing
              ? "opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/50"
              : isDark
                ? "bg-primary hover:bg-primary/80 border-primary/30 text-primary-foreground hover:scale-105"
                : "bg-primary hover:bg-primary/80 border-primary/30 text-primary-foreground hover:scale-105"
          )}
        >
          <span>Next</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
} 