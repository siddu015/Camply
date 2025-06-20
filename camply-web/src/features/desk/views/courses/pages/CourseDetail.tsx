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
  Plus,
  Eye
} from 'lucide-react';
import { SimpleLoader } from '@/components';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { EditCourseModal } from '../components/EditCourseModal';
import { CourseHeader } from '../components/CourseHeader';
import { SyllabusUpload } from '../components/SyllabusUpload';
import { SyllabusDisplay } from '../components/SyllabusDisplay';
import { supabase } from '@/lib/supabase';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  console.log('CourseDetail - courseId from params:', courseId); // Debug log

  const { course, loading, error, updateCourse, refreshCourse } = useCourseDetail(courseId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleSyllabusUploadSuccess = (storagePath: string) => {
    // Refresh course data to show the new syllabus
    refreshCourse?.();
  };

  const handleViewSyllabus = async () => {
    if (!course?.syllabus_storage_path) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('course_documents')
        .createSignedUrl(course.syllabus_storage_path, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return;
      }

      // Open PDF in new tab
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Error viewing syllabus:', err);
    }
  };

  const handleProcessSyllabus = async (courseId: string, userId: string) => {
    if (!course?.syllabus_storage_path) {
      console.error('No syllabus storage path found');
      return;
    }

    try {
      console.log('Processing syllabus for course:', courseId);
      
      // Call the backend to process the syllabus
      const response = await fetch('http://localhost:8001/process-syllabus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: courseId,
          user_id: userId,
          storage_path: course.syllabus_storage_path // Use the existing storage path
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Syllabus processed successfully:', result);
        // Refresh course data to get the processed syllabus JSON
        refreshCourse();
      } else {
        console.error('Failed to process syllabus:', result.error);
      }
    } catch (error) {
      console.error('Error processing syllabus:', error);
    }
  };

  if (loading) {
    return <SimpleLoader text="Loading course details..." />;
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
    <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
      <div className="space-y-6">
        <CourseHeader 
          course={course}
          onViewSyllabus={handleViewSyllabus}
        />

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

        {/* Syllabus Section */}
        <div className="bg-background border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Course Syllabus</h2>
          
          {!course.syllabus_storage_path ? (
            session?.user?.id && courseId && (
              <SyllabusUpload
                courseId={courseId}
                userId={session.user.id}
                onUploadSuccess={handleSyllabusUploadSuccess}
              />
            )
          ) : course.syllabus_json ? (
            <SyllabusDisplay syllabusData={course.syllabus_json} />
          ) : (
            <div className="text-center py-8">
              <div className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                isDark ? "bg-yellow-500/20" : "bg-yellow-500/10"
              )}>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Processing Syllabus
              </h3>
              <p className="text-muted-foreground mb-6">
                Your syllabus is being processed. This may take a few moments.
              </p>
              <button
                onClick={() => {
                  // Trigger processing
                  if (session?.user?.id && courseId) {
                    handleProcessSyllabus(courseId, session.user.id);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all mx-auto",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
              >
                <FileText className="h-5 w-5" />
                Process Syllabus
              </button>
            </div>
          )}
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