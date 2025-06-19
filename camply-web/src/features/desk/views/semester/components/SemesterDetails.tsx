import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { Calendar, Clock, FileText, GraduationCap, CheckCircle, AlertCircle } from 'lucide-react';
import type { Semester } from '../types';

interface SemesterDetailCardProps {
  label: string;
  value: string | number | null | undefined;
  icon: React.ReactNode;
  status?: 'current' | 'upcoming' | 'completed';
}

interface SemesterDetailsProps {
  semester: Semester;
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
              status === 'current' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              status === 'upcoming' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              status === 'completed' && "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
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



export const SemesterDetails = ({ semester }: SemesterDetailsProps) => {
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
        return { text: 'Current Semester', color: 'text-green-600 dark:text-green-400' };
      case 'planned':
        return { text: 'Planned', color: 'text-blue-600 dark:text-blue-400' };
      case 'completed':
        return { text: 'Completed', color: 'text-gray-600 dark:text-gray-400' };
      default:
        return { text: status, color: 'text-foreground' };
    }
  };

  const statusInfo = getStatusInfo(semester.status);

  // Check if IA dates have passed (simplified - you might want more sophisticated logic)
  const now = new Date();

  const isExamCompleted = semester.sem_exam_date ? new Date(semester.sem_exam_date) < now : false;

  return (
    <div className="space-y-6">
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

      {/* IA Dates */}
      {(semester.ia1_date || semester.ia2_date) && (
        <div className="bg-background border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            Internal Assessments
          </h2>
          
          <div className="space-y-3">
            {semester.ia1_date && (
              <div className={cn(
                "p-3 rounded-lg border flex items-center gap-3",
                "bg-muted/30 border-border"
              )}>
                <div className={cn(
                  "p-1.5 rounded-lg",
                  new Date(semester.ia1_date) < now
                    ? "bg-green-100 dark:bg-green-900/30" 
                    : "bg-blue-100 dark:bg-blue-900/30"
                )}>
                  {new Date(semester.ia1_date) < now ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Internal Assignment - 1</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      new Date(semester.ia1_date) < now
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {new Date(semester.ia1_date) < now ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(semester.ia1_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            
            {semester.ia2_date && (
              <div className={cn(
                "p-3 rounded-lg border flex items-center gap-3",
                "bg-muted/30 border-border"
              )}>
                <div className={cn(
                  "p-1.5 rounded-lg",
                  new Date(semester.ia2_date) < now
                    ? "bg-green-100 dark:bg-green-900/30" 
                    : "bg-blue-100 dark:bg-blue-900/30"
                )}>
                  {new Date(semester.ia2_date) < now ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Internal Assignment - 2</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      new Date(semester.ia2_date) < now
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {new Date(semester.ia2_date) < now ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(semester.ia2_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Semester End Exam */}
      {semester.sem_exam_date && (
        <div className="bg-background border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            Semester End Examination
          </h2>
          
          <div className={cn(
            "p-4 rounded-lg border flex items-center gap-4",
            "bg-muted/30 border-border"
          )}>
            <div className={cn(
              "p-2 rounded-lg",
              isExamCompleted 
                ? "bg-green-100 dark:bg-green-900/30" 
                : "bg-orange-100 dark:bg-orange-900/30"
            )}>
              {isExamCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Semester End Exam</span>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  isExamCompleted 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                )}>
                  {isExamCompleted ? 'Completed' : 'Upcoming'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(semester.sem_exam_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 