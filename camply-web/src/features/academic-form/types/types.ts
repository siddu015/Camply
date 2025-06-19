import type { UserFormData, College, DepartmentData } from '@/types/database';

export interface AcademicFormData extends UserFormData {}

export interface FormStep {
  id: number;
  title: string;
  isOptional?: boolean;
}

export interface StepComponentProps {
  formData: AcademicFormData;
  validationErrors: Record<string, string>;
  onFieldChange: (name: string, value: any) => void;
  autoFocus?: boolean;
  direction?: 'next' | 'prev' | null;
}

export interface FormContextType {
  formData: AcademicFormData;
  validationErrors: Record<string, string>;
  colleges: College[];
  departments: DepartmentData;
  selectedDepartmentCategory: string;
  availableBranches: string[];
  currentStep: number;
  totalSteps: number;
  isValidating: boolean;
  loading: boolean;
  error: string | null;

  setFormData: (data: Partial<AcademicFormData>) => void;
  setValidationErrors: (errors: Record<string, string>) => void;
  setSelectedDepartmentCategory: (category: string) => void;
  canProceedFromStep: (step: number) => boolean;
  nextStep: () => void;
  prevStep: () => void;
  handleFinalSubmit: () => Promise<void>;
}

export interface AcademicDetailsFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  initialData?: Partial<UserFormData>;
} 