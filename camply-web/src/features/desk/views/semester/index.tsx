import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Calendar, Plus, AlertCircle } from 'lucide-react';
import { useSemesterData } from './hooks/useSemesterData';
import { SemesterRegistrationForm } from './components/SemesterRegistrationForm';
import { SemesterDetails } from './components/SemesterDetails';
import SimpleLoader from '@/components/SimpleLoader';
import type { SemesterFormData } from './types';
import type { Course } from './hooks/useCourses';

export function CurrentSemester() {
  const [session, setSession] = useState<any>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const { 
    hasSemester, 
    currentSemester, 
    loading, 
    error, 
    registerSemester,
    refreshSemester 
  } = useSemesterData(session?.user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRegistrationSubmit = async (formData: SemesterFormData) => {
    setRegistrationLoading(true);
    try {
      await registerSemester(formData);
      setShowRegistrationForm(false);
    } catch (error) {
      console.error('Registration failed:', error);
      // You might want to show an error message here
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleCourseClick = (course: Course) => {
    // For now, we'll navigate to the Courses section with the course ID
    // Later this can be enhanced to navigate to individual course pages
    console.log('Navigate to course:', course);
    
    // Option 1: Navigate to courses section (placeholder for now)
    // window.location.hash = `#/desk/courses/${course.course_id}`;
    
    // Option 2: Show course details in a modal or expand inline
    alert(`Course clicked: ${course.course_name}\nThis will navigate to course details in the future.`);
  };

  if (loading || !session) {
    return <SimpleLoader />;
  }

  if (error) {
    return (
      <div className="w-full animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">Error loading semester data</h3>
          </div>
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={refreshSemester}
            className="px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
        {hasSemester && currentSemester ? (
          <SemesterDetails 
            semester={currentSemester} 
            onCourseClick={handleCourseClick}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className={cn(
              "px-6 py-10 rounded-xl mb-6",
              isDark ? "bg-primary/10" : "bg-primary/5"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-full",
                  isDark ? "bg-primary/20" : "bg-primary/10"
                )}>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Current Semester</h1>
                  <p className="text-muted-foreground">Manage your semester details and schedules</p>
                </div>
              </div>
            </div>

            {/* No Semester Registered Card */}
            <div className="bg-background border border-border rounded-xl p-8 text-center">
              <div className={cn(
                "w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center",
                isDark ? "bg-muted/30" : "bg-muted/20"
              )}>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <h2 className="text-xl font-semibold text-foreground mb-3">
                You are not registered for current semester
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Set up your current semester details including dates, internal assessments, and examination schedules to get started.
              </p>
              
              <button
                onClick={() => setShowRegistrationForm(true)}
                className={cn(
                  "inline-flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all",
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
              >
                <Plus className="h-5 w-5" />
                Register for Semester
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showRegistrationForm && (
          <SemesterRegistrationForm
            onSubmit={handleRegistrationSubmit}
            onCancel={() => setShowRegistrationForm(false)}
            loading={registrationLoading}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default CurrentSemester; 