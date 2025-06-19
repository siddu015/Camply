import { useState } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { BookOpen, Plus, GraduationCap, Loader2 } from 'lucide-react';
import { useCourses } from '../hooks/useCourses';
import { CourseCard } from './CourseCard';
import { AddCourseModal } from './AddCourseModal';
import type { Course } from '../hooks/useCourses';

interface SemesterCoursesProps {
  semesterId: string;
  onCourseClick?: (course: Course) => void;
}

const EmptyCoursesState = ({ onAddCourse }: { onAddCourse: () => void }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="text-center py-12">
      <div className={cn(
        "w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center",
        isDark ? "bg-muted/30" : "bg-muted/20"
      )}>
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No courses added yet
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Start building your semester by adding the courses you're enrolled in. You can add course details one by one.
      </p>
      
      <button
        onClick={onAddCourse}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
      >
        <Plus className="h-4 w-4" />
        Add Your First Course
      </button>
    </div>
  );
};

const CoursesList = ({ 
  courses, 
  onCourseClick, 
  onCourseEdit, 
  onCourseDelete 
}: {
  courses: Course[];
  onCourseClick?: (course: Course) => void;
  onCourseEdit: (course: Course) => void;
  onCourseDelete: (courseId: string) => void;
}) => {
  return (
    <div className="space-y-3">
      {courses.map(course => (
        <CourseCard
          key={course.course_id}
          course={course}
          onClick={onCourseClick}
          onEdit={onCourseEdit}
          onDelete={onCourseDelete}
        />
      ))}
    </div>
  );
};

const CoursesStats = ({ courses }: { courses: Course[] }) => {
  const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 0), 0);
  
  return (
    <div className="flex gap-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4" />
        <span>{courses.length} {courses.length === 1 ? 'Course' : 'Courses'}</span>
      </div>
      {totalCredits > 0 && (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span>{totalCredits} {totalCredits === 1 ? 'Credit' : 'Credits'}</span>
        </div>
      )}
    </div>
  );
};

export const SemesterCourses = ({ semesterId, onCourseClick }: SemesterCoursesProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const { courses, loading, error, addCourse, deleteCourse } = useCourses(semesterId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  const handleAddCourse = () => {
    setEditingCourse(null);
    setShowAddModal(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowAddModal(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setDeletingCourseId(courseId);
    try {
      await deleteCourse(courseId);
    } catch (err) {
      console.error('Failed to delete course:', err);
    } finally {
      setDeletingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="text-center py-8">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 inline-block mb-4">
            <BookOpen className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load courses</h3>
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors",
              "bg-destructive/20 hover:bg-destructive/30 text-destructive"
            )}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background border border-border rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-3 mb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Your Courses
            </h2>
            <CoursesStats courses={courses} />
          </div>
          
          <button
            onClick={handleAddCourse}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            <Plus className="h-4 w-4" />
            Add Course
          </button>
        </div>

        {/* Content */}
        {courses.length > 0 ? (
          <CoursesList
            courses={courses}
            onCourseClick={onCourseClick}
            onCourseEdit={handleEditCourse}
            onCourseDelete={handleDeleteCourse}
          />
        ) : (
          <EmptyCoursesState onAddCourse={handleAddCourse} />
        )}

        {/* Loading Overlay for Deletion */}
        {deletingCourseId && (
          <div className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-background border border-border rounded-lg p-6 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-foreground">Deleting course...</span>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Course Modal */}
      <AddCourseModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCourse(null);
        }}
        onSubmit={addCourse}
      />
    </>
  );
}; 