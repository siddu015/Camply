import { motion } from "framer-motion";
import { LargeInput, LargeLabel } from '../form-inputs';
import type { StepComponentProps } from '../../types';

export const RollNumberStep = ({ formData, validationErrors, onFieldChange, autoFocus, direction }: StepComponentProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange(e.target.name, e.target.value);
  };

  const getAnimationVariants = () => {
    const isGoingNext = direction === 'next';
    const isGoingPrev = direction === 'prev';
    
    return {
      initial: {
        opacity: 0,
        x: isGoingNext ? 100 : isGoingPrev ? -100 : 0,
        scale: 0.95
      },
      animate: {
        opacity: 1,
        x: 0,
        scale: 1
      },
      exit: {
        opacity: 0,
        x: isGoingNext ? -100 : isGoingPrev ? 100 : 0,
        scale: 0.95
      }
    };
  };

  return (
    <motion.div
      key="roll-step"
      variants={getAnimationVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1],
        opacity: { duration: 0.3 },
        scale: { duration: 0.4 }
      }}
      className="spacing-responsive-sm"
    >
      <div>
        <LargeLabel htmlFor="roll_number">What's your roll number?</LargeLabel>
        <p className="text-white/70 text-responsive-xs mt-1">Your student ID or roll number</p>
      </div>
      <LargeInput
        id="roll_number"
        name="roll_number"
        placeholder="Enter your roll number"
        type="text"
        value={formData.roll_number}
        onChange={handleChange}
        className={validationErrors.roll_number ? 'border-red-400 focus-visible:ring-red-400' : ''}
        autoFocus={autoFocus}
      />
      {validationErrors.roll_number && (
        <span className="form-error-responsive text-red-400">{validationErrors.roll_number}</span>
      )}
    </motion.div>
  );
}; 