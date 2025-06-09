import { motion } from "framer-motion";
import { LargeInput, LargeLabel } from '../form-inputs';
import type { StepComponentProps } from '../../types';

export const PhoneStep = ({ formData, validationErrors, onFieldChange, autoFocus, direction }: StepComponentProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone_number') {
      // Format phone number with +91 prefix
      let phoneValue = value;
      if (!phoneValue.startsWith('+91')) {
        phoneValue = '+91 ' + phoneValue.replace(/^\+91\s?/, '');
      }
      // Only allow digits after +91
      phoneValue = phoneValue.replace(/(\+91\s?)([^\d])/g, '$1');
      // Limit to 10 digits after +91
      const match = phoneValue.match(/^\+91\s?(\d{0,10})/);
      if (match) {
        phoneValue = '+91 ' + match[1];
      }
      onFieldChange(name, phoneValue);
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
      key="phone-step"
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
        <LargeLabel htmlFor="phone_number">What's your phone number?</LargeLabel>
        <p className="text-white/70 text-responsive-xs mt-1">We'll use this to send you updates (optional)</p>
      </div>
      <LargeInput
        id="phone_number"
        name="phone_number"
        placeholder="+91 99999 99999"
        type="tel"
        value={formData.phone_number}
        onChange={handleChange}
        className={validationErrors.phone_number ? 'border-red-400 focus-visible:ring-red-400' : ''}
        autoFocus={autoFocus}
      />
      {validationErrors.phone_number && (
        <span className="form-error-responsive text-red-400">{validationErrors.phone_number}</span>
      )}
    </motion.div>
  );
}; 