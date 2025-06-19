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

      case 'ia_dates':
        if (Array.isArray(value)) {
          // Validate all IA dates whenever ia_dates array changes
          value.forEach((ia, index) => {
            if (!ia.start) {
              errors[`ia_${index}_start`] = `Internal Assignment ${index + 1} date is required`;
            } else {
              const iaDate = new Date(ia.start);
              
              // Validate IA dates are within semester range
              if (formData.start_date) {
                const semStartDate = new Date(formData.start_date);
                if (iaDate < semStartDate) {
                  errors[`ia_${index}_start`] = `IA date must be after semester start date (${formData.start_date})`;
                }
              }
              
              if (formData.end_date) {
                const semEndDate = new Date(formData.end_date);
                if (iaDate > semEndDate) {
                  errors[`ia_${index}_start`] = `IA date must be before semester end date (${formData.end_date})`;
                }
              }
              
              // Validate IA-1 comes before IA-2
              if (index === 1 && value[0]?.start) {
                const ia1Date = new Date(value[0].start);
                if (iaDate <= ia1Date) {
                  errors[`ia_${index}_start`] = 'Internal Assignment 2 date must be after Internal Assignment 1';
                }
              }
            }
          });
        }
        break;

      case 'sem_end_dates':
        if (value && typeof value === 'object') {
          if (!value.start) {
            errors.sem_end_start = 'Exam start date is required';
          }
          if (!value.end) {
            errors.sem_end_end = 'Exam end date is required';
          }
          
          // Validate exam end date is after start date
          if (value.start && value.end) {
            const examStartDate = new Date(value.start);
            const examEndDate = new Date(value.end);
            if (examEndDate <= examStartDate) {
              errors.sem_end_end = 'Exam end date must be after start date';
            }
          }
          
          // Validate exam dates are after IA-2
          if (value.start && formData.ia_dates[1]?.start) {
            const examStartDate = new Date(value.start);
            const ia2Date = new Date(formData.ia_dates[1].start);
            if (examStartDate <= ia2Date) {
              errors.sem_end_start = `Exam start date must be after Internal Assignment 2 (${formData.ia_dates[1].start})`;
            }
          }
          
          // Validate exam dates are within semester range
          if (value.start && formData.end_date) {
            const examStartDate = new Date(value.start);
            const semEndDate = new Date(formData.end_date);
            if (examStartDate > semEndDate) {
              errors.sem_end_start = `Exam start date must be before semester end date (${formData.end_date})`;
            }
          }
          
          // Validate exam end date is within semester range
          if (value.end && formData.end_date) {
            const examEndDate = new Date(value.end);
            const semEndDate = new Date(formData.end_date);
            if (examEndDate > semEndDate) {
              errors.sem_end_end = `Exam end date must be before semester end date (${formData.end_date})`;
            }
          }
        }
        break;
    }

    return errors;
  };

  // Helper function to validate all IA dates when individual IA date changes
  const validateAllIADates = (): Record<string, string> => {
    return validateField('ia_dates', formData.ia_dates);
  };

  // Helper function to validate all semester exam dates when individual exam date changes
  const validateAllSemesterExamDates = (): Record<string, string> => {
    return validateField('sem_end_dates', formData.sem_end_dates);
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
        const hasAllIADates = formData.ia_dates.every(ia => Boolean(ia.start));
        const hasNoIAErrors = formData.ia_dates.every((_, index) => 
          !validationErrors[`ia_${index}_start`]
        );
        return hasAllIADates && hasNoIAErrors;

      case 3: // Semester Exam Step
        return Boolean(
          formData.sem_end_dates.start &&
          formData.sem_end_dates.end &&
          !validationErrors.sem_end_start &&
          !validationErrors.sem_end_end
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

    // Check IA dates (only start dates required)
    if (!formData.ia_dates.every(ia => ia.start)) {
      return false;
    }

    // Check semester end dates
    if (!formData.sem_end_dates.start || !formData.sem_end_dates.end) {
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
    if (formData.ia_dates[0]?.start && formData.ia_dates[1]?.start) {
      const ia1Date = new Date(formData.ia_dates[0].start);
      const ia2Date = new Date(formData.ia_dates[1].start);
      
      // IA-2 must be after IA-1
      if (ia2Date <= ia1Date) {
        return false;
      }
      
      // IA dates must be within semester range
      if (ia1Date < startDate || ia1Date > endDate || ia2Date < startDate || ia2Date > endDate) {
        return false;
      }
    }

    // Check exam dates
    if (new Date(formData.sem_end_dates.end) <= new Date(formData.sem_end_dates.start)) {
      return false;
    }

    // Check exam dates are after IA-2
    if (formData.ia_dates[1]?.start && formData.sem_end_dates.start) {
      if (new Date(formData.sem_end_dates.start) <= new Date(formData.ia_dates[1].start)) {
        return false;
      }
    }

    return true;
  }, [formData]);

  return {
    validateField,
    validateAllIADates,
    validateAllSemesterExamDates,
    canProceedFromStep,
    isFormValid
  };
} 