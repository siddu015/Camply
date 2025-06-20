import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Hash, 
  Award, 
  Calendar, 
  ArrowLeft, 
  Edit, 
  FileText, 
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import { SimpleLoader } from '@/components';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { EditCourseModal } from '../components/EditCourseModal';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  console.log('CourseDetail - courseId from params:', courseId); // Debug log

  const { course, loading, error, updateCourse } = useCourseDetail(courseId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleBack = () => {
    navigate('/semester/courses');
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateCourse = async (updateData: any) => {
    const result = await updateCourse(updateData);
    if (!result.error) {
      setIsEditModalOpen(false);
    }
    return result;
  };

  if (loading) {
    return <SimpleLoader fullScreen={false} text="Loading course details..." />;
  }

  if (error || !course) {
    return (
      <div className="w-full pt-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-destructive text-center">
            <h3 className="text-lg font-semibold mb-2">Course not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error || 'The requested course could not be found.'}
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const missingData = [];
  if (!course.course_code) missingData.push('Course Code');
  if (!course.credits) missingData.push('Credits');

  return (
    <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full pt-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">
                {course.course_name}
              </h1>
            </div>
            <p className="text-muted-foreground">
              Course details and information
            </p>
          </div>

          <button
            onClick={handleEdit}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              "bg-accent text-accent-foreground hover:bg-accent/80"
            )}
          >
            <Edit className="h-4 w-4" />
            Edit Course
          </button>
        </div>

        {missingData.length > 0 && (
          <div className={cn(
            "p-4 rounded-lg border",
            "bg-orange-500/10 border-orange-500/20"
          )}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Incomplete Course Information
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Some course details are missing: {missingData.join(', ')}
                </p>
                <button
                  onClick={handleEdit}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm",
                    "bg-orange-500/20 text-orange-600 hover:bg-orange-500/30"
                  )}
                >
                  <Plus className="h-3 w-3" />
                  Add Missing Details
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={cn(
          "bg-background border border-border rounded-lg p-6 space-y-6"
        )}>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Course Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Course Name</label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                  <span className="text-foreground">{course.course_name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Course Code</label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                  {course.course_code ? (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{course.course_code}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground italic">Not added</span>
                      <button
                        onClick={handleEdit}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs",
                          "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Credits</label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                  {course.credits ? (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground italic">Not added</span>
                      <button
                        onClick={handleEdit}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs",
                          "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Semester</label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Semester {course.semester_number}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Syllabus</label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                  {course.syllabus_storage_path ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">Syllabus uploaded</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground italic">No syllabus uploaded</span>
                      <button
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs",
                          "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                        disabled
                      >
                        <Plus className="h-3 w-3" />
                        Upload
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Added On</label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {new Date(course.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "bg-background border border-border rounded-lg p-6 text-center"
        )}>
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Course Content Coming Soon
          </h3>
          <p className="text-muted-foreground">
            Advanced course features like units, topics, assignments, and study materials will be available soon.
          </p>
        </div>
      </div>

      {isEditModalOpen && (
        <EditCourseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateCourse}
          course={course}
        />
      )}
    </div>
  );
}

export default CourseDetail; 