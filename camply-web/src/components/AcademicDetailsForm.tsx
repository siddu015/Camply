import { useState, useEffect } from 'react';
import type { UserFormData, College, DepartmentData } from '../types/database';

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
    college_name: initialData?.college_name || '',
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
          fetch('/Colleges.json'),
          fetch('/Departments.json')
        ]);

        const collegesData = await collegesResponse.json();
        const departmentsData = await departmentsResponse.json();

        setColleges(collegesData);
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
    const selectedCollege = colleges.find(c => c.college_id === collegeId);
    
    setFormData(prev => ({
      ...prev,
      college_id: collegeId,
      college_name: selectedCollege?.college_name || ''
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Academic Details</h1>
          <p className="mt-2 text-gray-600">Please provide your academic information to continue</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="college_id" className="block text-sm font-medium text-gray-700">
                College/University *
              </label>
              <select
                id="college_id"
                name="college_id"
                required
                value={formData.college_id}
                onChange={handleCollegeChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              >
                <option value="">Select your college</option>
                {colleges.map((college) => (
                  <option key={college.college_id} value={college.college_id}>
                    {college.college_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="department_category" className="block text-sm font-medium text-gray-700">
                Department Category *
              </label>
              <select
                id="department_category"
                required
                value={selectedDepartmentCategory}
                onChange={handleDepartmentCategoryChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              >
                <option value="">Select department category</option>
                {Object.keys(departments).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="branch_name" className="block text-sm font-medium text-gray-700">
                Branch/Specialization *
              </label>
              <select
                id="branch_name"
                name="branch_name"
                required
                value={formData.branch_name}
                onChange={handleBranchChange}
                disabled={!selectedDepartmentCategory}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select your branch</option>
                {availableBranches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="roll_number" className="block text-sm font-medium text-gray-700">
                Roll Number *
              </label>
              <input
                type="text"
                id="roll_number"
                name="roll_number"
                required
                value={formData.roll_number}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="admission_year" className="block text-sm font-medium text-gray-700">
                Admission Year *
              </label>
              <input
                type="number"
                id="admission_year"
                name="admission_year"
                required
                min="2000"
                max="2030"
                value={formData.admission_year}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="graduation_year" className="block text-sm font-medium text-gray-700">
                Expected Graduation Year *
              </label>
              <input
                type="number"
                id="graduation_year"
                name="graduation_year"
                required
                min="2020"
                max="2035"
                value={formData.graduation_year}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Academic Details'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AcademicDetailsForm; 