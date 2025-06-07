import { useState, useEffect } from 'react';
import type { UserFormData, College, DepartmentData } from '../types/database';
import { supabase } from '../lib/supabase';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '../lib/utils';
import { useMotionTemplate, useMotionValue, motion } from "framer-motion";

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

  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || '',
    phone_number: initialData?.phone_number || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const collegeId = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      college_id: collegeId
    }));
  };

  const handleDepartmentCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedDepartmentCategory(category);
    
    // Reset department and branch when category changes
    setFormData(prev => ({
      ...prev,
      department_name: category,
      branch_name: ''
    }));
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branch = e.target.value;
    setFormData(prev => ({
      ...prev,
      branch_name: branch
    }));
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
          rgba(59, 130, 246, 0.6),
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
              "shadow-input dark:placeholder-text-neutral-600 flex h-10 w-full rounded-md border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 pr-8 text-sm text-black transition duration-400 group-hover/input:shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:ring-[2px] focus-visible:ring-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/5 dark:bg-white/5 dark:backdrop-blur-md dark:text-white dark:shadow-[0px_0px_1px_1px_#404040] dark:focus-visible:ring-neutral-600 appearance-none",
              disabled && "bg-white/2 dark:bg-white/2 cursor-not-allowed opacity-50"
            )}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
      <div className="mx-auto w-full max-w-2xl rounded-none border border-gray-300 bg-white p-4 shadow-input dark:border-gray-800 dark:bg-black md:rounded-2xl md:p-8">
        <div className="text-left mb-8">
          <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-200">
            Welcome to Camply
          </h2>
          <p className="text-left mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Please provide your academic information to get started with your campus adventures
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="my-8">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="flex flex-col space-y-2 w-full">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
              />
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
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2 mb-4 w-full">
            <Label htmlFor="college_id">College/University</Label>
            <SelectInput
              id="college_id"
              name="college_id"
              className="bg-gray-100 dark:bg-zinc-900"
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
          </div>

          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="flex flex-col space-y-2 w-full">
              <Label htmlFor="department_category">Department Category</Label>
              <SelectInput
                id="department_category"
                required
                value={selectedDepartmentCategory}
                onChange={handleDepartmentCategoryChange}
              >
                <option value="">Select department category</option>
                {Object.keys(departments).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="flex flex-col space-y-2 w-full">
              <Label htmlFor="branch_name">Branch/Specialization</Label>
              <SelectInput
                id="branch_name"
                name="branch_name"
                required
                value={formData.branch_name}
                onChange={handleBranchChange}
                disabled={!selectedDepartmentCategory}
              >
                <option value="">Select your branch</option>
                {availableBranches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>

          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="flex flex-col space-y-2 w-full">
              <Label htmlFor="roll_number">Roll Number</Label>
              <Input
                id="roll_number"
                name="roll_number"
                placeholder="Your roll number"
                type="text"
                required
                value={formData.roll_number}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-8">
            <div className="flex flex-col space-y-2 w-full">
              <Label htmlFor="admission_year">Admission Year</Label>
              <Input
                id="admission_year"
                name="admission_year"
                placeholder="2020"
                type="number"
                required
                min="2000"
                max="2030"
                value={formData.admission_year}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col space-y-2 w-full">
              <Label htmlFor="graduation_year">Expected Graduation Year</Label>
              <Input
                id="graduation_year"
                name="graduation_year"
                placeholder="2024"
                type="number"
                required
                min="2020"
                max="2035"
                value={formData.graduation_year}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving Details...
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
  );
};

export default AcademicDetailsForm; 