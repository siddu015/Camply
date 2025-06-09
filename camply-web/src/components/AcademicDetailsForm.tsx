import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserFormData, College, DepartmentData } from '../types/database';
import { supabase } from '../lib/supabase';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '../lib/utils';
import { useMotionTemplate, useMotionValue, motion, AnimatePresence } from "framer-motion";
import { AuroraBackground } from './ui/aurora-background';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AcademicDetailsFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  initialData?: Partial<UserFormData>;
}

const TOTAL_STEPS = 6;

const AcademicDetailsForm = ({ onSubmit, loading, error, initialData }: AcademicDetailsFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<DepartmentData>({});
  const [selectedDepartmentCategory, setSelectedDepartmentCategory] = useState<string>('');
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  
  // Add validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || '',
    phone_number: initialData?.phone_number ? 
      (initialData.phone_number.startsWith('+91') ? initialData.phone_number : `+91 ${initialData.phone_number}`) 
      : '+91 ',
    college_id: initialData?.college_id || '',
    department_name: initialData?.department_name || '',
    branch_name: initialData?.branch_name || '',
    admission_year: initialData?.admission_year || new Date().getFullYear(),
    graduation_year: initialData?.graduation_year || new Date().getFullYear() + 4,
    roll_number: initialData?.roll_number || ''
  });

  // Load colleges and departments data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [collegesResponse, departmentsResponse] = await Promise.all([
          supabase.from('colleges').select('college_id, name, city, state, university_name'),
          fetch('/Departments.json')
        ]);

        if (collegesResponse.error) {
          console.error('Error fetching colleges:', collegesResponse.error);
        } else {
          setColleges(collegesResponse.data || []);
        }

        const departmentsData = await departmentsResponse.json();
        setDepartments(departmentsData);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, []);

  // Update available branches when department category changes
  useEffect(() => {
    if (selectedDepartmentCategory && departments[selectedDepartmentCategory]) {
      setAvailableBranches(departments[selectedDepartmentCategory]);
    } else {
      setAvailableBranches([]);
    }
  }, [selectedDepartmentCategory, departments]);

  // Validation functions
  const validateField = (name: string, value: any) => {
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
        // Roll number is optional, so no required validation
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
  };

  const checkPhoneNumberExists = async (phoneNumber: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('phone_number')
        .eq('phone_number', phoneNumber)
        .limit(1);
      
      if (error) {
        console.error('Error checking phone number:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (err) {
      console.error('Error checking phone number:', err);
      return false;
    }
  };

  // Step validation functions
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: // Name step
        return !!(formData.name && formData.name.trim().length >= 2 && !validationErrors.name);
      case 1: // Phone step (optional)
        return true; // Always can proceed since phone is optional
      case 2: // College step
        return !!(formData.college_id && !validationErrors.college_id);
      case 3: // Department & Branch step
        return !!(formData.department_name && formData.branch_name && !validationErrors.department_name && !validationErrors.branch_name);
      case 4: // Roll number step (optional)
        return true; // Always can proceed
      case 5: // Academic years step
        return !!(formData.admission_year && formData.graduation_year && !validationErrors.admission_year && !validationErrors.graduation_year);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1 && canProceedFromStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setIsValidating(true);
    
    // Check if phone number already exists (only if phone number is provided)
    const phoneDigits = formData.phone_number ? formData.phone_number.replace(/^\+91\s?/, '') : '';
    
    if (phoneDigits && phoneDigits.length === 10) {
      try {
        const phoneExists = await checkPhoneNumberExists(phoneDigits);
        if (phoneExists) {
          setValidationErrors({ phone_number: 'This phone number is already registered. Please use a different number.' });
          setCurrentStep(1); // Go back to phone step
          setIsValidating(false);
          return;
        }
      } catch (err) {
        console.error('Error validating phone number:', err);
      }
    }
    
    const dataToSave = {
      ...formData,
      phone_number: phoneDigits || undefined
    };
    
    try {
      await onSubmit(dataToSave);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Clear field-specific error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
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
      setFormData(prev => ({ ...prev, [name]: phoneValue }));
    } else if (name === 'admission_year' || name === 'graduation_year') {
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
      setFormData(prev => ({ 
        ...prev, 
        [name]: yearValue ? parseInt(yearValue) : 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
    }
    
    // Clear previous validation timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Real-time validation for the changed field (debounced)
    validationTimeoutRef.current = setTimeout(() => {
      const fieldErrors = validateField(name, name === 'phone_number' ? 
        (value.startsWith('+91') ? value : `+91 ${value.replace(/^\+91\s?/, '')}`) : 
        (type === 'number' ? parseInt(value) || 0 : value));
      
      // Only update validation errors if there are actual changes
      setValidationErrors(prev => {
        const hasChanges = Object.keys(fieldErrors).length > 0 || prev[name];
        if (!hasChanges) return prev;
        
        return {
          ...prev,
          ...fieldErrors
        };
      });
    }, 300); // Reduced timeout for better responsiveness
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (name === 'department_category') {
      setSelectedDepartmentCategory(value);
      setFormData(prev => ({
        ...prev,
        department_name: value,
        branch_name: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setTimeout(() => {
      const fieldErrors = validateField(name === 'department_category' ? 'department_name' : name, value);
      setValidationErrors(prev => ({
        ...prev,
        ...fieldErrors
      }));
    }, 100);
  };

  // Enhanced Input Component with larger sizing
  const LargeInput = useCallback(({ children, disabled = false, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { disabled?: boolean }) => {
    const radius = 100;
    const [visible, setVisible] = useState(false);

    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    const handleMouseMove = useCallback(({ currentTarget, clientX, clientY }: any) => {
      let { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }, [mouseX, mouseY]);

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.2),
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300"
      >
        <input
          {...props}
          disabled={disabled}
          className={cn(
            "flex h-12 md:h-14 w-full rounded-md border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 text-base md:text-lg text-white transition duration-400 group-hover/input:shadow-lg file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[2px] focus-visible:ring-white/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 shadow-lg relative placeholder:text-white/50",
            "before:absolute before:inset-0 before:rounded-md before:opacity-10 before:mix-blend-soft-light before:pointer-events-none",
            `before:bg-[url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")]`,
            disabled && "bg-white/2 cursor-not-allowed opacity-50",
            props.className
          )}
        />
      </motion.div>
    );
  }, []);

  // Enhanced Select Component with larger sizing
  const LargeSelect = ({ children, disabled = false, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { disabled?: boolean }) => {
    const radius = 100;
    const [visible, setVisible] = useState(false);

    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
      let { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.2),
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300"
      >
        <div className="relative">
          <select
            {...props}
            disabled={disabled}
            className={cn(
              "flex h-12 md:h-14 w-full rounded-md border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 pr-10 text-base md:text-lg text-white transition duration-400 group-hover/input:shadow-lg file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[2px] focus-visible:ring-white/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 appearance-none shadow-lg relative",
              "before:absolute before:inset-0 before:rounded-md before:opacity-10 before:mix-blend-soft-light before:pointer-events-none",
              `before:bg-[url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")]`,
              disabled && "bg-white/2 cursor-not-allowed opacity-50"
            )}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <ChevronRight className="h-6 w-6 text-white/70 rotate-90" />
          </div>
        </div>
      </motion.div>
    );
  };

  // Large Label Component
  const LargeLabel = ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label 
      {...props}
      className={cn(
        "text-xl md:text-2xl font-semibold text-white drop-shadow-lg mb-3 block",
        props.className
      )}
    >
      {children}
    </label>
  );

  // Step Components
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Name Step
        return (
          <motion.div
            key="name-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
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
              autoFocus
            />
            {validationErrors.name && (
              <span className="text-red-400 text-sm mt-2">{validationErrors.name}</span>
            )}
          </motion.div>
        );

      case 1: // Phone Step
        return (
          <motion.div
            key="phone-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-6"
          >
            <div>
              <LargeLabel htmlFor="phone_number">What's your phone number?</LargeLabel>
              <p className="text-white/70 text-sm mt-1">We'll use this to send you updates (optional)</p>
            </div>
            <LargeInput
              id="phone_number"
              name="phone_number"
              placeholder="+91 99999 99999"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              className={validationErrors.phone_number ? 'border-red-400 focus-visible:ring-red-400' : ''}
              autoFocus
            />
            {validationErrors.phone_number && (
              <span className="text-red-400 text-sm mt-2">{validationErrors.phone_number}</span>
            )}
          </motion.div>
        );

      case 2: // College Step
        return (
          <motion.div
            key="college-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-6"
          >
            <LargeLabel htmlFor="college_id">Which college do you attend?</LargeLabel>
            <LargeSelect
              id="college_id"
              name="college_id"
              value={formData.college_id}
              onChange={handleSelectChange}
              className={validationErrors.college_id ? 'border-red-400' : ''}
              autoFocus
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

      case 3: // Department & Branch Step
        return (
          <motion.div
            key="department-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-6"
          >
            <LargeLabel>What's your field of study?</LargeLabel>
            
            <div className="space-y-5">
              <div>
                <label className="text-base text-white/90 mb-2 block">Department Category</label>
                <LargeSelect
                  name="department_category"
                  value={selectedDepartmentCategory}
                  onChange={handleSelectChange}
                  className={validationErrors.department_name ? 'border-red-400' : ''}
                  autoFocus
                >
                  <option value="">Select department category</option>
                  {Object.keys(departments).map((category) => (
                    <option key={category} value={category} className="bg-gray-800 text-white">
                      {category}
                    </option>
                  ))}
                </LargeSelect>
                {validationErrors.department_name && (
                  <span className="text-red-400 text-sm mt-2">{validationErrors.department_name}</span>
                )}
              </div>

              <div>
                <label className="text-base text-white/90 mb-2 block">Branch/Specialization</label>
                <LargeSelect
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleSelectChange}
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
                  <span className="text-red-400 text-sm mt-2">{validationErrors.branch_name}</span>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 4: // Roll Number Step
        return (
          <motion.div
            key="roll-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-6"
          >
            <div>
              <LargeLabel htmlFor="roll_number">What's your roll number?</LargeLabel>
              <p className="text-white/70 text-sm mt-1">Your student ID or roll number</p>
            </div>
            <LargeInput
              id="roll_number"
              name="roll_number"
              placeholder="Enter your roll number"
              type="text"
              value={formData.roll_number}
              onChange={handleChange}
              className={validationErrors.roll_number ? 'border-red-400 focus-visible:ring-red-400' : ''}
              autoFocus
            />
            {validationErrors.roll_number && (
              <span className="text-red-400 text-sm mt-2">{validationErrors.roll_number}</span>
            )}
          </motion.div>
        );

      case 5: // Academic Years Step
        return (
          <motion.div
            key="years-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
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
                   autoFocus
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

      default:
        return null;
    }
  };

  return (
    <AuroraBackground>
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white/3 backdrop-blur-xl p-6 md:p-10 shadow-xl border border-white/5 relative overflow-hidden min-h-[450px]">
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-soft-light pointer-events-none" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
               backgroundSize: '100px 100px'
             }}>
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="text-left mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
              Welcome to Camply
            </h2>
            <p className="text-left mt-3 text-base text-white/90 drop-shadow-md">
              Let's set up your academic profile
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-xs">Step {currentStep + 1} of {TOTAL_STEPS}</span>
              <span className="text-white/70 text-xs">{Math.round(((currentStep + 1) / TOTAL_STEPS) * 100)}% complete</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <motion.div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8 min-h-[220px]">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center space-x-2 px-6 py-3 rounded-lg text-white transition-all duration-200",
                currentStep === 0 
                  ? "opacity-0 cursor-not-allowed" 
                  : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </button>

            {currentStep === TOTAL_STEPS - 1 ? (
              <button
                onClick={handleFinalSubmit}
                disabled={!canProceedFromStep(currentStep) || loading || isValidating}
                className="group/btn relative px-8 py-4 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading || isValidating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{isValidating ? 'Validating...' : 'Creating Profile...'}</span>
                  </div>
                ) : (
                  'Complete Registration'
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceedFromStep(currentStep)}
                className="group/btn relative flex items-center space-x-2 px-8 py-4 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                <span>Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default AcademicDetailsForm; 