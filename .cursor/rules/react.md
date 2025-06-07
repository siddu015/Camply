# React Rules for Camply Project

## Component Structure

### File Organization

```
src/
├── components/           # Reusable UI components
├── pages/               # Route components
├── hooks/               # Custom hooks
├── lib/                 # Utilities and configurations
├── types/               # TypeScript type definitions
└── assets/              # Static assets
```

### Component Naming

- Use PascalCase for component files: `AcademicDetailsForm.tsx`
- Use descriptive names that indicate purpose
- Suffix with component type when needed: `UserFormModal.tsx`

### Component Export Pattern

```typescript
// Default export for main component
const AcademicDetailsForm = ({ props }: Props) => {
  return <div>...</div>;
};

export default AcademicDetailsForm;

// Named exports for sub-components or utilities from same file
export { SubComponent };
```

## Component Props & State

### Props Interface

```typescript
interface ComponentProps {
  // Required props first
  onSubmit: (data: FormData) => Promise<void>;
  loading: boolean;

  // Optional props with default values
  error?: string | null;
  initialData?: Partial<FormData>;

  // Event handlers with proper typing
  onCancel?: () => void;
  onChange?: (field: string, value: any) => void;
}
```

### State Management

```typescript
// Use specific types for state
const [formData, setFormData] = useState<UserFormData>({
  name: "",
  phone_number: "",
  college_id: "",
  // ... other fields with proper defaults
});

// Separate loading and error states
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

### Form Handling Patterns

```typescript
// Generic change handler
const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value, type } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: type === "number" ? parseInt(value) || 0 : value,
  }));
};

// Specific handlers for complex logic
const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const collegeId = e.target.value;
  setFormData((prev) => ({
    ...prev,
    college_id: collegeId,
  }));
};

// Async form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    await onSubmit(formData);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Submission failed");
  } finally {
    setLoading(false);
  }
};
```

## Custom Hooks

### Hook Naming

- Always start with `use`: `useUserData`, `useFormValidation`
- Be descriptive about hook purpose

### Hook Structure

```typescript
export const useUserData = (session: Session | null) => {
  const [userStatus, setUserStatus] = useState<UserStatus>({
    exists: false,
    hasAcademicDetails: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Main functionality
  const checkUser = async () => {
    // Implementation
  };

  const saveUserData = async (formData: UserFormData) => {
    // Implementation
  };

  // Effect hooks
  useEffect(() => {
    if (session?.user) {
      checkUser();
    }
  }, [session]);

  // Return stable object
  return {
    userStatus,
    loading,
    error,
    saveUserData,
    refetch: checkUser,
  };
};
```

## Loading & Error States

### Loading UI Pattern

```typescript
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
```

### Error Display Pattern

```typescript
{
  error && (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
      {error}
    </div>
  );
}
```

### Form Loading States

```typescript
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
    "Save Academic Details"
  )}
</button>
```

## Styling Guidelines

### Tailwind CSS Usage

- Use consistent spacing: `p-4`, `m-4`, `space-y-6`
- Consistent color palette: `bg-black`, `text-gray-600`, `border-gray-300`
- Responsive design: `grid-cols-1 md:grid-cols-2`

### Form Styling

```typescript
// Consistent input styling
className =
  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black";

// Disabled state styling
className = "... disabled:bg-gray-100 disabled:cursor-not-allowed";

// Error state styling
className = "... border-red-300 focus:ring-red-500 focus:border-red-500";
```

### Layout Patterns

```typescript
// Page wrapper
<div className="min-h-screen flex items-center justify-center bg-secondary p-4">
  // Content container
  <div className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
    // Form grid
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">// Form fields</div>
  </div>
</div>
```

## Performance Optimization

### useCallback Usage

```typescript
// Memoize event handlers passed to child components
const handleSubmit = useCallback(
  async (formData: UserFormData) => {
    await saveUserData(formData);
  },
  [saveUserData]
);

// Memoize complex change handlers
const handleCollegeChange = useCallback(
  (e: React.ChangeEvent<HTMLSelectElement>) => {
    const collegeId = e.target.value;
    setFormData((prev) => ({ ...prev, college_id: collegeId }));
  },
  []
);
```

### useMemo Usage

```typescript
// Memoize expensive computations
const filteredOptions = useMemo(() => {
  return colleges.filter((college) =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [colleges, searchTerm]);

// Memoize derived state
const isFormValid = useMemo(() => {
  return formData.name && formData.college_id && formData.department_name;
}, [formData.name, formData.college_id, formData.department_name]);
```

### React.memo Usage

```typescript
// Memoize components that receive stable props
const MemoizedFormField = React.memo<FormFieldProps>(
  ({ label, value, onChange }) => {
    return (
      <div>
        <label>{label}</label>
        <input value={value} onChange={onChange} />
      </div>
    );
  }
);
```

## Error Boundaries

### Error Boundary Component

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600">
              Something went wrong
            </h2>
            <p className="text-gray-600 mt-2">
              Please refresh the page and try again.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Accessibility Guidelines

### Form Accessibility

```typescript
// Proper labeling
<label htmlFor="college_id" className="block text-sm font-medium text-gray-700">
  College/University *
</label>
<select
  id="college_id"
  name="college_id"
  required
  aria-describedby={error ? "college-error" : undefined}
  // ... other props
>
  <option value="">Select your college</option>
  {/* options */}
</select>

// Error announcement
{error && (
  <div id="college-error" role="alert" className="text-red-600 text-sm mt-1">
    {error}
  </div>
)}
```

### Keyboard Navigation

- Ensure all interactive elements are focusable
- Use proper tab order
- Provide visual focus indicators
- Support keyboard shortcuts where appropriate

## Component Testing Guidelines

### Component Test Structure

```typescript
describe("AcademicDetailsForm", () => {
  const mockProps = {
    onSubmit: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form fields correctly", () => {
    render(<AcademicDetailsForm {...mockProps} />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/college/i)).toBeInTheDocument();
  });

  it("handles form submission", async () => {
    render(<AcademicDetailsForm {...mockProps} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "John Doe" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "John Doe" })
      );
    });
  });
});
```

## Code Organization

### Import Order

```typescript
// 1. React imports
import { useState, useEffect, useCallback } from "react";

// 2. Third-party imports
import { supabase } from "@supabase/supabase-js";

// 3. Type imports
import type { UserFormData, College } from "../types/database";

// 4. Local imports
import { createUser } from "../lib/database";

// 5. Relative imports
import "./Component.css";
```

### Component Organization

```typescript
// Props interface
interface ComponentProps {}

// Main component
const Component = ({ props }: ComponentProps) => {
  // State declarations
  // Effect hooks
  // Event handlers
  // Render helpers
  // Main render return
};

// Sub-components (if any)
const SubComponent = () => {};

// Default export
export default Component;
```
