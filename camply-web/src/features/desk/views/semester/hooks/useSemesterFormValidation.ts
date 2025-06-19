import { useMemo } from 'react';
import type { SemesterFormData } from '../types';

export function useSemesterFormValidation(formData: SemesterFormData) {
  const validateField = (name: string, value: any): Record<string, string> => {
    const errors: Record<string, string> = {};

    switch (name) {
      case 'semester_number':
        if (!value || value < 1 || value > 8) {
          errors.semester_number = 'Please select a valid semester (1-8)';
        }
        break;

      case 'start_date':
        if (!value) {
          errors.start_date = 'Semester start date is required';
        }
        break;

      case 'end_date':
        if (!value) {
          errors.end_date = 'Semester end date is required';
        } else if (formData.start_date) {
          const startDate = new Date(formData.start_date);
          const endDate = new Date(value);
          const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (endDate <= startDate) {
            errors.end_date = 'End date must be after start date';
          } else if (daysDiff < 90) {
            errors.end_date = 'Semester must be at least 90 days long';
          }
        }
        break;

      case 'ia1_date':
        if (!value) {
          errors.ia1_date = 'Internal Assignment 1 date is required';
        } else {
          const iaDate = new Date(value);
          
          // Validate IA dates are within semester range
          if (formData.start_date) {
            const semStartDate = new Date(formData.start_date);
            if (iaDate < semStartDate) {
              errors.ia1_date = `IA-1 date must be after semester start date (${formData.start_date})`;
            }
          }
          
          if (formData.end_date) {
            const semEndDate = new Date(formData.end_date);
            if (iaDate > semEndDate) {
              errors.ia1_date = `IA-1 date must be before semester end date (${formData.end_date})`;
            }
          }
        }
        break;

      case 'ia2_date':
        if (!value) {
          errors.ia2_date = 'Internal Assignment 2 date is required';
        } else {
          const iaDate = new Date(value);
          
          // Validate IA dates are within semester range
          if (formData.start_date) {
            const semStartDate = new Date(formData.start_date);
            if (iaDate < semStartDate) {
              errors.ia2_date = `IA-2 date must be after semester start date (${formData.start_date})`;
            }
          }
          
          if (formData.end_date) {
            const semEndDate = new Date(formData.end_date);
            if (iaDate > semEndDate) {
              errors.ia2_date = `IA-2 date must be before semester end date (${formData.end_date})`;
            }
          }
          
          // Validate IA-2 comes after IA-1
          if (formData.ia1_date) {
            const ia1Date = new Date(formData.ia1_date);
            if (iaDate <= ia1Date) {
              errors.ia2_date = 'Internal Assignment 2 date must be after Internal Assignment 1';
            }
          }
        }
        break;

      case 'sem_exam_date':
        if (!value) {
          errors.sem_exam_date = 'Semester end exam date is required';
        } else {
          const examDate = new Date(value);
          
          // Validate exam date is after IA-2
          if (formData.ia2_date) {
            const ia2Date = new Date(formData.ia2_date);
            if (examDate <= ia2Date) {
              errors.sem_exam_date = `Exam date must be after Internal Assignment 2 (${formData.ia2_date})`;
            }
          }
          
          // Validate exam date is within semester range
          if (formData.end_date) {
            const semEndDate = new Date(formData.end_date);
            if (examDate > semEndDate) {
              errors.sem_exam_date = `Exam date must be before semester end date (${formData.end_date})`;
            }
          }
        }
        break;
    }

    return errors;
  };

  // Helper function to validate all IA dates when individual IA date changes
  const validateAllIADates = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const ia1Errors = validateField('ia1_date', formData.ia1_date);
    const ia2Errors = validateField('ia2_date', formData.ia2_date);
    return { ...errors, ...ia1Errors, ...ia2Errors };
  };

  // Helper function to validate semester exam date
  const validateSemesterExamDate = (): Record<string, string> => {
    return validateField('sem_exam_date', formData.sem_exam_date);
  };

  const canProceedFromStep = (step: number, validationErrors: Record<string, string>): boolean => {
    switch (step) {
      case 0: // Basic Info Step
        return Boolean(
          formData.semester_number &&
          formData.semester_number >= 1 &&
          formData.semester_number <= 8 &&
          !validationErrors.semester_number
        );

      case 1: // Semester Dates Step
        return Boolean(
          formData.start_date &&
          formData.end_date &&
          !validationErrors.start_date &&
          !validationErrors.end_date
        );

      case 2: // IA Dates Step
        // Check that all IA dates exist and have no validation errors
        const hasAllIADates = Boolean(formData.ia1_date && formData.ia2_date);
        const hasNoIAErrors = !validationErrors.ia1_date && !validationErrors.ia2_date;
        return hasAllIADates && hasNoIAErrors;

      case 3: // Semester Exam Step
        return Boolean(
          formData.sem_exam_date &&
          !validationErrors.sem_exam_date
        );

      case 4: // Confirmation Step
        return true; // Always can proceed from confirmation step

      default:
        return false;
    }
  };

  const isFormValid = useMemo(() => {
    // Check basic info
    if (!formData.semester_number || formData.semester_number < 1 || formData.semester_number > 8) {
      return false;
    }

    // Check semester dates
    if (!formData.start_date || !formData.end_date) {
      return false;
    }

    // Check IA dates are present
    if (!formData.ia1_date || !formData.ia2_date) {
      return false;
    }

    // Check semester end exam date
    if (!formData.sem_exam_date) {
      return false;
    }

    // Check enhanced date logic
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (endDate <= startDate || daysDiff < 90) {
      return false;
    }

    // Check IA date order and within semester range
    const ia1Date = new Date(formData.ia1_date);
    const ia2Date = new Date(formData.ia2_date);
    
    // IA-2 must be after IA-1
    if (ia2Date <= ia1Date) {
      return false;
    }
    
    // IA dates must be within semester range
    if (ia1Date < startDate || ia1Date > endDate || ia2Date < startDate || ia2Date > endDate) {
      return false;
    }

    // Check exam date is after IA-2 and before semester end
    const examDate = new Date(formData.sem_exam_date);
    if (examDate <= ia2Date || examDate > endDate) {
      return false;
    }

    return true;
  }, [formData]);

  return {
    validateField,
    validateAllIADates,
    validateSemesterExamDate,
    canProceedFromStep,
    isFormValid
  };
} 