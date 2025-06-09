import { motion } from "framer-motion";
import { LargeSelect, LargeLabel } from '../form-inputs';
import type { StepComponentProps } from '../../types';
import type { College } from '../../../../types/database';

interface CollegeStepProps extends StepComponentProps {
  colleges: College[];
}

export const CollegeStep = ({ formData, validationErrors, onFieldChange, autoFocus, direction, colleges }: CollegeStepProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
      key="college-step"
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
      <LargeLabel htmlFor="college_id">Which college do you attend?</LargeLabel>
      <LargeSelect
        id="college_id"
        name="college_id"
        value={formData.college_id}
        onChange={handleChange}
        className={validationErrors.college_id ? 'border-red-400' : ''}
        autoFocus={autoFocus}
      >
        <option value="">Select your college</option>
        {colleges.map((college) => (
          <option key={college.college_id} value={college.college_id} className="bg-gray-800 text-white">
            {college.name} {college.city && college.state && `- ${college.city}, ${college.state}`}
          </option>
        ))}
      </LargeSelect>
      {validationErrors.college_id && (
        <span className="text-red-400 text-sm mt-2">{validationErrors.college_id}</span>
      )}
    </motion.div>
  );
}; 