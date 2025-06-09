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
    <div className="flex justify-between items-center">
      <button
        onClick={onPrev}
        disabled={isFirstStep}
        className={cn(
          "flex items-center space-x-2 px-6 py-3 rounded-lg text-white transition-all duration-200",
          isFirstStep 
            ? "opacity-0 cursor-not-allowed" 
            : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
        )}
      >
        <ChevronLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      {isFinalStep ? (
        <button
          onClick={onSubmit}
          disabled={!canProceed || loading || isValidating}
          className="group/btn relative px-8 py-4 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading || isValidating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{isValidating ? 'Validating...' : 'Creating Profile...'}</span>
            </div>
          ) : (
            'Complete Registration'
          )}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="group/btn relative flex items-center space-x-2 px-8 py-4 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          <span>Next</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}; 