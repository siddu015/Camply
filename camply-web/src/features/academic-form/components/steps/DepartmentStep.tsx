import { motion } from "framer-motion";
import { LargeSelect, LargeLabel } from '../form-inputs';
import type { StepComponentProps } from '../../types';
import type { DepartmentData } from '../../../../types/database';

interface DepartmentStepProps extends StepComponentProps {
  departments: DepartmentData;
  selectedDepartmentCategory: string;
  availableBranches: string[];
  onDepartmentCategoryChange: (category: string) => void;
}

export const DepartmentStep = ({ 
  formData, 
  validationErrors, 
  onFieldChange, 
  autoFocus, 
  direction,
  departments,
  selectedDepartmentCategory,
  availableBranches,
  onDepartmentCategoryChange
}: DepartmentStepProps) => {
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    onDepartmentCategoryChange(category);
    onFieldChange('department_name', category);
    onFieldChange('branch_name', '');
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFieldChange('branch_name', e.target.value);
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
      key="department-step"
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
      className="spacing-responsive-md"
    >
      <LargeLabel>What's your field of study?</LargeLabel>
      
      <div className="spacing-responsive-sm">
        <div>
          <label className="text-responsive-base text-white/90 mb-2 block">Department Category</label>
          <LargeSelect
            name="department_category"
            value={selectedDepartmentCategory}
            onChange={handleDepartmentChange}
            className={validationErrors.department_name ? 'border-red-400' : ''}
            autoFocus={autoFocus}
          >
            <option value="">Select department category</option>
            {Object.keys(departments).map((category) => (
              <option key={category} value={category} className="bg-gray-800 text-white">
                {category}
              </option>
            ))}
          </LargeSelect>
          {validationErrors.department_name && (
            <span className="form-error-responsive text-red-400">{validationErrors.department_name}</span>
          )}
        </div>

        <div>
          <label className="text-responsive-base text-white/90 mb-2 block">Branch/Specialization</label>
          <LargeSelect
            name="branch_name"
            value={formData.branch_name}
            onChange={handleBranchChange}
            disabled={!selectedDepartmentCategory}
            className={validationErrors.branch_name ? 'border-red-400' : ''}
          >
            <option value="">Select your branch</option>
            {availableBranches.map((branch) => (
              <option key={branch} value={branch} className="bg-gray-800 text-white">
                {branch}
              </option>
            ))}
          </LargeSelect>
          {validationErrors.branch_name && (
            <span className="form-error-responsive text-red-400">{validationErrors.branch_name}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 