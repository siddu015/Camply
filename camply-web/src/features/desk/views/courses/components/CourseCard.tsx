import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { BookOpen, Hash, Award, Calendar, Eye } from 'lucide-react';
import type { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onClick?: (course: Course) => void;
  showSemester?: boolean;
}

export const CourseCard = ({ course, onClick, showSemester = true }: CourseCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleCardClick = () => {
    onClick?.(course);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(course);
  };

  return (
    <div 
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-lg border transition-all duration-200",
        "bg-background border-border hover:border-primary/30 hover:shadow-sm",
        "cursor-pointer"
      )}
      onClick={handleCardClick}
    > 
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">
            {course.course_name}
          </h3>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {showSemester && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Semester {course.semester_number}</span>
            </div>
          )}
          
          {course.credits && (
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              <span>{course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onClick && (
          <button
            onClick={handleView}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all font-medium text-sm",
              "bg-primary/10 text-primary hover:bg-primary/20",
              "border border-primary/20 hover:border-primary/30"
            )}
            title="View course details"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
        )}
      </div>
        
      <div className={cn(
        "absolute inset-0 rounded-lg border-2 border-primary/20 opacity-0 transition-opacity pointer-events-none",
        "group-hover:opacity-100"
      )} />
    </div>
  );
}; 