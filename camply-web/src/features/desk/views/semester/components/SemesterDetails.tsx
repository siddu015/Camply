import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { Calendar, Clock, FileText, GraduationCap, CheckCircle, AlertCircle } from 'lucide-react';
import { AcademicTimeline } from './AcademicTimeline';
import { SemesterCourses } from './SemesterCourses';
import type { Semester } from '../types';
import type { Course } from '../hooks/useCourses';

interface SemesterDetailCardProps {
  label: string;
  value: string | number | null | undefined;
  icon: React.ReactNode;
  status?: 'current' | 'upcoming' | 'completed';
}

interface SemesterDetailsProps {
  semester: Semester;
  onCourseClick?: (course: Course) => void;
}

const SemesterDetailCard = ({ label, value, icon, status }: SemesterDetailCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={cn(
      "p-4 rounded-xl border flex items-start gap-4",
      "bg-background border-border"
    )}>
      <div className={cn(
        "p-2 rounded-lg",
        isDark ? "bg-primary/10" : "bg-primary/5",
      )}>
        {icon}
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">{value || 'Not available'}</span>
          {status && (
            <span className={cn(
              "px-2 py-1 text-xs rounded-full font-medium",
              status === 'current' && "bg-green-500/10 text-green-500",
              status === 'upcoming' && "bg-blue-500/10 text-blue-500",
              status === 'completed' && "bg-muted text-muted-foreground"
            )}>
              {status === 'current' && 'Current'}
              {status === 'upcoming' && 'Upcoming'}
              {status === 'completed' && 'Completed'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};



export const SemesterDetails = ({ semester, onCourseClick }: SemesterDetailsProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start || !end) return 'Not specified';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ongoing':
        return { text: 'Current Semester', color: 'text-green-500' };
      case 'planned':
        return { text: 'Planned', color: 'text-blue-500' };
      case 'completed':
        return { text: 'Completed', color: 'text-muted-foreground' };
      default:
        return { text: status, color: 'text-foreground' };
    }
  };

  const statusInfo = getStatusInfo(semester.status);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className={cn(
        "p-6 rounded-xl border",
        "bg-background border-border"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-lg",
              isDark ? "bg-primary/10" : "bg-primary/5"
            )}>
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Semester {semester.semester_number}
              </h1>
              <p className={cn("text-sm font-medium", statusInfo.color)}>
                {statusInfo.text}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SemesterDetailCard 
            label="Semester Period" 
            value={formatDateRange(semester.start_date, semester.end_date)}
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
          
          <SemesterDetailCard 
            label="Status" 
            value={statusInfo.text}
            icon={<FileText className="h-5 w-5 text-primary" />}
          />
          
          <SemesterDetailCard 
            label="Semester Number" 
            value={`Semester ${semester.semester_number}`}
            icon={<GraduationCap className="h-5 w-5 text-primary" />}
          />
        </div>
      </div>

      {/* Academic Timeline */}
      <AcademicTimeline semester={semester} />

      {/* Semester Courses */}
      <SemesterCourses 
        semesterId={semester.semester_id} 
        onCourseClick={onCourseClick}
      />
    </div>
  );
}; 