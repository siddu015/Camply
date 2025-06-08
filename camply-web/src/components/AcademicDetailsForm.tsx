import { useState, useEffect } from 'react';
import type { UserFormData, College, DepartmentData } from '../types/database';
import { supabase } from '../lib/supabase';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '../lib/utils';
import { useMotionTemplate, useMotionValue, motion } from "framer-motion";
import { AuroraBackground } from './ui/aurora-background';

interface AcademicDetailsFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  initialData?: Partial<UserFormData>;
}

const AcademicDetailsForm = ({ onSubmit, loading, error, initialData }: AcademicDetailsFormProps) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<DepartmentData>({});
  const [selectedDepartmentCategory, setSelectedDepartmentCategory] = useState<string>('');
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  
  // Add validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

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
        // Phone number is now optional, so no error if empty
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
        if (!value || value.trim().length < 1) {
          errors.roll_number = 'Roll number is required';
        } else if (value.trim().length > 20) {
          errors.roll_number = 'Roll number cannot exceed 20 characters';
        }
        break;
        
      case 'admission_year':
        const currentYear = new Date().getFullYear();
        if (!value || value < 2000) {
          errors.admission_year = 'Please enter a valid admission year (minimum 2000)';
        } else if (value > currentYear) {
          errors.admission_year = `Admission year cannot be greater than current year (${currentYear})`;
        }
        break;
        
      case 'graduation_year':
        if (!value || value < 2020) {
          errors.graduation_year = 'Please enter a valid graduation year (minimum 2020)';
        } else if (value > 2040) {
          errors.graduation_year = 'Graduation year cannot exceed 2040';
        } else if (formData.admission_year && value <= formData.admission_year) {
          errors.graduation_year = 'Graduation year must be after admission year';
        }
        break;
    }
    
    return errors;
  };

  const validateAllFields = () => {
    const allErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key as keyof UserFormData]);
      Object.assign(allErrors, fieldErrors);
    });
    
    setValidationErrors(allErrors);
    return Object.keys(allErrors).length === 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    
    // Clear previous errors
    setValidationErrors({});
    
    // Validate all fields
    if (!validateAllFields()) {
      setIsValidating(false);
      return;
    }
    
    // Check if phone number already exists (only if phone number is provided)
    const phoneDigits = formData.phone_number ? formData.phone_number.replace(/^\+91\s?/, '') : '';
    
    if (phoneDigits && phoneDigits.length === 10) {
      try {
        const phoneExists = await checkPhoneNumberExists(phoneDigits);
        if (phoneExists) {
          setValidationErrors({ phone_number: 'This phone number is already registered. Please use a different number.' });
          setIsValidating(false);
          return;
        }
      } catch (err) {
        console.error('Error validating phone number:', err);
      }
    }
    
    const dataToSave = {
      ...formData,
      phone_number: phoneDigits || undefined  // Save undefined if no phone number provided
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
    } else if (name === 'admission_year') {
      const currentYear = new Date().getFullYear();
      const yearValue = parseInt(value) || 0;
      if (yearValue <= currentYear) {
        setFormData(prev => ({ ...prev, [name]: yearValue }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
    }
    
    // Real-time validation for the changed field
    setTimeout(() => {
      const fieldErrors = validateField(name, name === 'phone_number' ? 
        (value.startsWith('+91') ? value : `+91 ${value.replace(/^\+91\s?/, '')}`) : 
        (type === 'number' ? parseInt(value) || 0 : value));
      
      setValidationErrors(prev => ({
        ...prev,
        ...fieldErrors
      }));
    }, 500);
  };

  const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const collegeId = e.target.value;
    
    // Clear field-specific error when user makes selection
    if (validationErrors.college_id) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.college_id;
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      college_id: collegeId
    }));
    
    // Validate the field
    setTimeout(() => {
      const fieldErrors = validateField('college_id', collegeId);
      setValidationErrors(prev => ({
        ...prev,
        ...fieldErrors
      }));
    }, 100);
  };

  const handleDepartmentCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    
    // Clear field-specific errors
    if (validationErrors.department_name || validationErrors.branch_name) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.department_name;
        delete newErrors.branch_name;
        return newErrors;
      });
    }
    
    setSelectedDepartmentCategory(category);
    
    // Reset department and branch when category changes
    setFormData(prev => ({
      ...prev,
      department_name: category,
      branch_name: ''
    }));
    
    // Validate the field
    setTimeout(() => {
      const fieldErrors = validateField('department_name', category);
      setValidationErrors(prev => ({
        ...prev,
        ...fieldErrors
      }));
    }, 100);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branch = e.target.value;
    
    // Clear field-specific error when user makes selection
    if (validationErrors.branch_name) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.branch_name;
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      branch_name: branch
    }));
    
    // Validate the field
    setTimeout(() => {
      const fieldErrors = validateField('branch_name', branch);
      setValidationErrors(prev => ({
        ...prev,
        ...fieldErrors
      }));
    }, 100);
  };

  const SelectInput = ({ children, disabled = false, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { disabled?: boolean }) => {
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
              "flex h-10 w-full rounded-md border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-2 pr-8 text-sm text-white transition duration-400 group-hover/input:shadow-lg file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[2px] focus-visible:ring-white/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 appearance-none shadow-lg relative",
              "before:absolute before:inset-0 before:rounded-md before:opacity-10 before:mix-blend-soft-light before:pointer-events-none",
              `before:bg-[url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")]`,
              disabled && "bg-white/2 cursor-not-allowed opacity-50"
            )}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AuroraBackground>
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white/5 backdrop-blur-2xl p-4 shadow-2xl border border-white/10 md:p-8 relative overflow-hidden">
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-soft-light pointer-events-none" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
               backgroundSize: '100px 100px'
             }}>
        </div>
        
        <div className="relative z-10">
          <div className="text-left mb-8">
            <h2 className="text-2xl font-black text-white drop-shadow-lg">
              Welcome to Camply
            </h2>
            <p className="text-left mt-2 text-sm text-white/90 drop-shadow-md">
              Please provide your academic information to get started with your campus adventures
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-md bg-red-500/15 backdrop-blur-sm border border-red-300/20 text-red-100 shadow-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="my-8">
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={validationErrors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {validationErrors.name && (
                  <span className="text-red-400 text-xs mt-1">{validationErrors.name}</span>
                )}
              </div>
              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  placeholder="+91 99999 99999"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={validationErrors.phone_number ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {validationErrors.phone_number && (
                  <span className="text-red-400 text-xs mt-1">{validationErrors.phone_number}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-2 mb-4 w-full">
              <Label htmlFor="college_id">College/University *</Label>
              <SelectInput
                id="college_id"
                name="college_id"
                className={`bg-gray-100 dark:bg-zinc-900 ${validationErrors.college_id ? 'border-red-400' : ''}`}
                required
                value={formData.college_id}
                onChange={handleCollegeChange}
              >
                <option value="">Select your college</option>
                {colleges.map((college) => (
                  <option key={college.college_id} value={college.college_id}>
                    {college.name} {college.city && college.state && `- ${college.city}, ${college.state}`}
                  </option>
                ))}
              </SelectInput>
              {validationErrors.college_id && (
                <span className="text-red-400 text-xs mt-1">{validationErrors.college_id}</span>
              )}
            </div>

            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="department_category">Department Category *</Label>
                <SelectInput
                  id="department_category"
                  required
                  value={selectedDepartmentCategory}
                  onChange={handleDepartmentCategoryChange}
                  className={validationErrors.department_name ? 'border-red-400' : ''}
                >
                  <option value="">Select department category</option>
                  {Object.keys(departments).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </SelectInput>
                {validationErrors.department_name && (
                  <span className="text-red-400 text-xs mt-1">{validationErrors.department_name}</span>
                )}
              </div>
              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="branch_name">Branch/Specialization *</Label>
                <SelectInput
                  id="branch_name"
                  name="branch_name"
                  required
                  value={formData.branch_name}
                  onChange={handleBranchChange}
                  disabled={!selectedDepartmentCategory}
                  className={validationErrors.branch_name ? 'border-red-400' : ''}
                >
                  <option value="">Select your branch</option>
                  {availableBranches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </SelectInput>
                {validationErrors.branch_name && (
                  <span className="text-red-400 text-xs mt-1">{validationErrors.branch_name}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="roll_number">Roll Number *</Label>
                <Input
                  id="roll_number"
                  name="roll_number"
                  placeholder="Your roll number"
                  type="text"
                  required
                  value={formData.roll_number}
                  onChange={handleChange}
                  className={validationErrors.roll_number ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {validationErrors.roll_number && (
                  <span className="text-red-400 text-xs mt-1">{validationErrors.roll_number}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-8">
              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="admission_year">Admission Year *</Label>
                <Input
                  id="admission_year"
                  name="admission_year"
                  placeholder="2020"
                  type="number"
                  required
                  min="2000"
                  max={new Date().getFullYear()}
                  value={formData.admission_year}
                  onChange={handleChange}
                  className={validationErrors.admission_year ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {validationErrors.admission_year && (
                  <span className="text-red-400 text-xs mt-1">{validationErrors.admission_year}</span>
                )}
              </div>
              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="graduation_year">Expected Graduation Year *</Label>
                <Input
                  id="graduation_year"
                  name="graduation_year"
                  placeholder="2024"
                  type="number"
                  required
                  min="2020"
                  max="2040"
                  value={formData.graduation_year}
                  onChange={handleChange}
                  className={validationErrors.graduation_year ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {validationErrors.graduation_year && (
                  <span className="text-red-400 text-xs mt-1">{validationErrors.graduation_year}</span>
                )}
              </div>
            </div>

            <button
              className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading || isValidating || Object.keys(validationErrors).filter(key => key !== 'phone_number').length > 0}
            >
              {loading || isValidating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isValidating ? 'Validating...' : 'Saving Details...'}
                </div>
              ) : (
                'Save Academic Details →'
              )}
              <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
              <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
            </button>
          </form>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default AcademicDetailsForm; 