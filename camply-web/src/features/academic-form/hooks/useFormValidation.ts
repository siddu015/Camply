import { useCallback } from 'react';
import type { AcademicFormData } from '../types';

export const useFormValidation = (formData: AcademicFormData) => {
  const validateField = useCallback((name: string, value: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          errors.name = 'Full name must be at least 2 characters long';
        } else if (!/^[a-zA-Z\s.]+$/.test(value)) {
          errors.name = 'Name can only contain letters, spaces, and dots';
        }
        break;
        
      case 'phone_number':
        if (value && value !== '+91 ') {
          const phoneRegex = /^\+91\s?\d{10}$/;
          if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            errors.phone_number = 'Phone number must be exactly 10 digits with +91 prefix';
          }
        }
        break;
        
      case 'college_id':
        if (!value) {
          errors.college_id = 'Please select your college/university';
        }
        break;
        
      case 'department_name':
        if (!value) {
          errors.department_name = 'Please select a department category';
        }
        break;
        
      case 'branch_name':
        if (!value) {
          errors.branch_name = 'Please select your branch/specialization';
        }
        break;
        
      case 'roll_number':
        if (value && value.trim().length > 20) {
          errors.roll_number = 'Roll number cannot exceed 20 characters';
        }
        break;
        
      case 'admission_year':
        const currentYear = new Date().getFullYear();
        if (!value || value < 2000) {
          errors.admission_year = 'Please enter a valid admission year (minimum 2000)';
        } else if (value > currentYear) {
          errors.admission_year = `Admission year cannot be greater than current year (${currentYear})`;
        } else if (value.toString().length !== 4) {
          errors.admission_year = 'Admission year must be exactly 4 digits';
        } else if (!value.toString().startsWith('2')) {
          errors.admission_year = 'Admission year must start with 2';
        }
        break;
        
      case 'graduation_year':
        if (!value || value < 2020) {
          errors.graduation_year = 'Please enter a valid graduation year (minimum 2020)';
        } else if (value > 2040) {
          errors.graduation_year = 'Graduation year cannot exceed 2040';
        } else if (value.toString().length !== 4) {
          errors.graduation_year = 'Graduation year must be exactly 4 digits';
        } else if (!value.toString().startsWith('2')) {
          errors.graduation_year = 'Graduation year must start with 2';
        } else if (formData.admission_year && value <= formData.admission_year) {
          errors.graduation_year = 'Graduation year must be after admission year';
        } else if (formData.admission_year && (value - formData.admission_year) < 1) {
          errors.graduation_year = 'There must be at least 1 year gap between admission and graduation';
        } else if (formData.admission_year && value === formData.admission_year) {
          errors.graduation_year = 'Graduation year cannot be the same as admission year';
        }
        break;
    }
    
    return errors;
  }, [formData.admission_year]);

  const canProceedFromStep = useCallback((step: number, validationErrors: Record<string, string>): boolean => {
    switch (step) {
      case 0:
        return !!(formData.name && formData.name.trim().length >= 2 && !validationErrors.name);
      case 1:
        return true;
      case 2:
        return !!(formData.college_id && !validationErrors.college_id);
      case 3:
        return !!(formData.department_name && formData.branch_name && !validationErrors.department_name && !validationErrors.branch_name);
      case 4:
        return true;
      case 5:
        return !!(formData.admission_year && formData.graduation_year && !validationErrors.admission_year && !validationErrors.graduation_year);
      default:
        return false;
    }
  }, [formData]);

  return {
    validateField,
    canProceedFromStep
  };
}; 