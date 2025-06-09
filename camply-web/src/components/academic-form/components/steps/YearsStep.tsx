import { motion } from "framer-motion";
import { LargeInput, LargeLabel } from '../form-inputs';
import type { StepComponentProps } from '../../types';

export const YearsStep = ({ formData, validationErrors, onFieldChange, autoFocus, direction }: StepComponentProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'admission_year' || name === 'graduation_year') {
      // Handle year fields with 4-digit limitation starting with 2
      let yearValue = value.replace(/\D/g, ''); // Remove non-digits
      
      // Limit to 4 digits
      if (yearValue.length > 4) {
        yearValue = yearValue.slice(0, 4);
      }
      
      // Only auto-prefix with 2 if user types a single digit that's not 2
      if (yearValue.length === 1 && yearValue !== '2') {
        yearValue = '2' + yearValue;
      }
      
      // Store as string to prevent display issues, convert to number for validation
      onFieldChange(name, yearValue ? parseInt(yearValue) : 0);
    } else {
      onFieldChange(name, value);
    }
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
      key="years-step"
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
      <LargeLabel>When did you start and when will you graduate?</LargeLabel>
      
      <div className="space-y-5">
        <div>
          <label className="text-base text-white/90 mb-2 block">Admission Year</label>
          <LargeInput
            name="admission_year"
            placeholder="2020"
            type="text"
            inputMode="numeric"
            pattern="[2][0-9]{3}"
            maxLength={4}
            value={formData.admission_year === 0 ? '' : formData.admission_year.toString()}
            onChange={handleChange}
            className={validationErrors.admission_year ? 'border-red-400 focus-visible:ring-red-400' : ''}
            autoFocus={autoFocus}
          />
          {validationErrors.admission_year && (
            <span className="text-red-400 text-sm mt-2">{validationErrors.admission_year}</span>
          )}
        </div>

        <div>
          <label className="text-base text-white/90 mb-2 block">Expected Graduation Year</label>
          <LargeInput
            name="graduation_year"
            placeholder="2024"
            type="text"
            inputMode="numeric"
            pattern="[2][0-9]{3}"
            maxLength={4}
            value={formData.graduation_year === 0 ? '' : formData.graduation_year.toString()}
            onChange={handleChange}
            className={validationErrors.graduation_year ? 'border-red-400 focus-visible:ring-red-400' : ''}
          />
          {validationErrors.graduation_year && (
            <span className="text-red-400 text-sm mt-2">{validationErrors.graduation_year}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 