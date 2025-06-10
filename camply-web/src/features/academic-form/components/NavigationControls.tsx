import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isValidating: boolean;
  loading: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
}

export const NavigationControls = ({
  currentStep,
  totalSteps,
  canProceed,
  isValidating,
  loading,
  onNext,
  onPrev,
  onSubmit
}: NavigationControlsProps) => {
  const isFirstStep = currentStep === 0;
  const isFinalStep = currentStep === totalSteps - 1;

  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-0">
      <button
        onClick={onPrev}
        disabled={isFirstStep}
        className={cn(
          "flex items-center justify-center space-x-2 form-button-responsive text-white transition-smooth w-full sm:w-auto touch-target",
          isFirstStep 
            ? "opacity-0 cursor-not-allowed pointer-events-none" 
            : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
        )}
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-responsive-sm">Back</span>
      </button>

      {isFinalStep ? (
        <button
          onClick={onSubmit}
          disabled={!canProceed || loading || isValidating}
          className="group/btn relative form-button-responsive bg-gradient-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-lg hover:shadow-xl transition-smooth disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto touch-target"
        >
          {loading || isValidating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
              <span className="text-responsive-sm">
                {isValidating ? 'Validating...' : 'Creating Profile...'}
              </span>
            </div>
          ) : (
            <span className="text-responsive-sm">Complete Registration</span>
          )}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="group/btn relative flex items-center justify-center space-x-2 form-button-responsive bg-gradient-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-lg hover:shadow-xl transition-smooth disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto touch-target"
        >
          <span className="text-responsive-sm">Next</span>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
    </div>
  );
}; 