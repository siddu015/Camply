import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { AcademicDetails } from '../components/AcademicDetails';
import { AcademicTimeline } from '../components/AcademicTimeline';
import { HandbookQuery } from '../components/HandbookQuery';
import { useAcademicData } from '../hooks/useAcademicData';
import { GraduationCap } from 'lucide-react';
import SimpleLoader from '@/components/SimpleLoader';

export function AcademicOverview() {
  const [session, setSession] = useState<any>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const { 
    user, 
    academicDetails, 
    college, 
    currentYear, 
    loading, 
    error 
  } = useAcademicData(session?.user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || !session) {
    return <SimpleLoader text="Loading your academic profile..." />;
  }

  if (error || !user || !academicDetails) {
    return <SimpleLoader text="Setting up your academic workspace..." />;
  }

  return (
    <div className="w-full animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
      <div className={cn(
        "px-6 py-10 rounded-xl mb-6",
        isDark ? "bg-primary/10" : "bg-primary/5"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-full",
            isDark ? "bg-primary/20" : "bg-primary/10"
          )}>
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Academic Overview</h1>
            <p className="text-muted-foreground">Manage your academic journey</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <AcademicDetails 
          user={user}
          academicDetails={academicDetails}
          college={college}
        />
        
        <AcademicTimeline
          admissionYear={academicDetails.admission_year}
          graduationYear={academicDetails.graduation_year}
          currentYear={currentYear}
        />

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Department Handbook</h2>
          
          <div className="min-h-[600px]">
            <HandbookQuery 
              userId={user.user_id}
              academicId={academicDetails.academic_id!}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 