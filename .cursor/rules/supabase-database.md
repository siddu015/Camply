# Database Schema Rules

## Table Structure & Relationships

### Core Tables

- `colleges` - Reference table for institutions
- `users` - Auth users with basic profile info
- `user_academic_details` - Academic information linked to users
- `semesters` - Semester data per academic record
- `courses` - Course data per semester

### Primary Keys & UUIDs

- All tables use UUID primary keys with `uuid_generate_v4()` default
- Foreign key references use proper UUID constraints
- Never use string IDs for database operations

### Required Relationships

```sql
users.academic_id → user_academic_details.academic_id
user_academic_details.college_id → colleges.college_id
user_academic_details.latest_semester_id → semesters.semester_id
semesters.academic_id → user_academic_details.academic_id
courses.semester_id → semesters.semester_id
```

## TypeScript Interface Rules

### College Interface

```typescript
interface College {
  college_id: string; // UUID from database
  name: string;
  city?: string;
  state?: string;
  university_name?: string;
}
```

### User Academic Details

```typescript
interface UserAcademicDetails {
  academic_id?: string;
  user_id: string;
  college_id?: string; // UUID reference to colleges table
  department_name: string;
  branch_name: string;
  admission_year: number;
  graduation_year: number;
  roll_number: string;
  college_rulebook_url?: string;
  latest_semester_id?: string;
  created_at?: string;
}
```

### Form Data

```typescript
interface UserFormData {
  name: string;
  phone_number?: string;
  college_id: string; // UUID from college selection
  department_name: string;
  branch_name: string;
  admission_year: number;
  graduation_year: number;
  roll_number: string;
}
```

## Database Operation Rules

### College Operations

- Always fetch colleges from `supabase.from('colleges').select('college_id, name, city, state, university_name')`
- Store `college_id` (UUID) in academic details, not college name
- Display format: `{name} - {city}, {state}` when both city/state exist

### Academic Details Creation

```typescript
const academicData = {
  user_id: userId,
  college_id: formData.college_id || null, // Use actual UUID
  department_name: formData.department_name,
  branch_name: formData.branch_name,
  admission_year: formData.admission_year,
  graduation_year: formData.graduation_year,
  roll_number: formData.roll_number,
};
```

### Error Handling

- Handle duplicate phone numbers (unique constraint)
- Handle duplicate users (23505 error code)
- Always check for RLS policy violations
- Log database operations for debugging

## RLS (Row Level Security) Rules

### User Access Patterns

- Users can only access their own data (`auth.uid() = user_id`)
- Colleges are publicly readable
- Academic details, semesters, and courses follow user ownership hierarchy

### Policy Naming Convention

- `"Users can [action] own [resource]"` for user-specific policies
- `"Anyone can view [resource]"` for public read access

## Migration Rules

### File Naming

- Format: `YYYYMMDD_HHMMSS_descriptive_name.sql`
- Always include descriptive names for clarity

### Migration Content

- Include `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` when using UUIDs
- Always add RLS policies after table creation
- Use `IF NOT EXISTS` for idempotent operations
- Add proper foreign key constraints

### Required Policies for New Tables

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Add appropriate policies based on access patterns
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT USING (user_id = auth.uid());
```

## Form Handling Rules

### College Selection

- Use `<select>` with `college_id` as value
- Display: `{college.name} {city && state && '- city, state'}`
- Store UUID in form state, not college name

### Department/Branch Selection

- Load departments from static JSON
- Use hierarchical selection (category → branch)
- Store final branch name in database

### Validation

- Require college_id selection
- Validate year ranges (admission: 2000-2030, graduation: 2020-2035)
- Require all mandatory fields before submission

## API Response Handling

### Supabase Responses

- Always check for `error` property first
- Use `.single()` for single row operations
- Use `.select()` to specify returned columns
- Handle PGRST116 error (no rows) gracefully

### Error Patterns

```typescript
if (error && error.code !== "PGRST116") {
  throw error;
}
```

## UI/UX Consistency

### Loading States

- Show spinner during database operations
- Disable forms during submission
- Provide clear error messages

### Form Display

- Group related fields logically
- Use responsive grid layouts
- Show validation errors inline
- Maintain consistent styling with Tailwind classes

## Security Considerations

### Phone Number Handling

- Unique constraint enforced at database level
- Handle duplicate phone number gracefully in UI
- Allow null phone numbers

### User Creation Flow

1. Create/update user record
2. Create academic details
3. Link academic_id back to user
4. Handle rollback if any step fails

## Future Development Guidelines

### Adding New Tables

- Always use UUID primary keys
- Add proper RLS policies
- Create appropriate foreign key relationships
- Update TypeScript interfaces
- Add to this documentation

### Modifying Existing Tables

- Create migration files for all changes
- Update TypeScript interfaces accordingly
- Test RLS policies after changes
- Update form handling if needed

### API Integration

- Maintain consistent error handling patterns
- Use proper TypeScript types for all operations
- Follow the established database operation patterns
- Document new API endpoints
