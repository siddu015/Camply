import { motion } from "framer-motion";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  const progressPercentage = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/70 text-xs">Step {currentStep + 1} of {totalSteps}</span>
        <span className="text-white/70 text-xs">{progressPercentage}% complete</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5">
        <motion.div 
          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}; 