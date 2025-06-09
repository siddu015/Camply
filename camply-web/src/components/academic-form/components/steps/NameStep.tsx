import { motion } from "framer-motion";
import { LargeInput, LargeLabel } from '../form-inputs';
import type { StepComponentProps } from '../../types';

export const NameStep = ({ formData, validationErrors, onFieldChange, autoFocus, direction }: StepComponentProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange(e.target.name, e.target.value);
  };

  // Directional animation variants
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
      key="name-step"
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
      className="flex flex-col space-y-6"
    >
      <LargeLabel htmlFor="name">What's your full name?</LargeLabel>
      <LargeInput
        id="name"
        name="name"
        placeholder="Enter your full name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        className={validationErrors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}
        autoFocus={autoFocus}
      />
      {validationErrors.name && (
        <span className="text-red-400 text-sm mt-2">{validationErrors.name}</span>
      )}
    </motion.div>
  );
}; 