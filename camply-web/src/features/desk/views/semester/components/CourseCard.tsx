import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { BookOpen, Hash, Award, MoreVertical, Trash2, Edit, Eye } from 'lucide-react';
import { useState } from 'react';
import type { Course } from '../hooks/useCourses';

interface CourseCardProps {
  course: Course;
  onClick?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (courseId: string) => void;
}

export const CourseCard = ({ course, onClick, onEdit, onDelete }: CourseCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [showActions, setShowActions] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on action buttons
    if ((e.target as HTMLElement).closest('.course-actions')) {
      return;
    }
    onClick?.(course);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    onEdit?.(course);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    onDelete?.(course.course_id);
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
      {/* Course Icon */}
      <div className={cn(
        "flex-shrink-0 p-2.5 rounded-lg",
        isDark ? "bg-primary/10" : "bg-primary/5"
      )}>
        <BookOpen className="h-5 w-5 text-primary" />
      </div>
      
      {/* Course Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">
            {course.course_name}
          </h3>
          {course.course_code && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {course.course_code}
              </span>
            </div>
          )}
        </div>
        
        {/* Course Details Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.credits && (
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              <span>{course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}</span>
            </div>
          )}
          
          {/* Course Status/Progress indicator could go here */}
          <span className="text-xs opacity-75">
            Course
          </span>
        </div>
      </div>

      {/* Action Buttons - Only visible on hover */}
      <div className="course-actions flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Three Dots Menu */}
        {(onEdit || onDelete) && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className={cn(
                "p-2 rounded-md transition-colors",
                "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              title="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showActions && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                
                {/* Actions Menu */}
                <div className={cn(
                  "absolute right-0 top-10 z-20 w-36 rounded-md border shadow-lg",
                  "bg-background border-border"
                )}>
                  {onEdit && (
                    <button
                      onClick={handleEdit}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2",
                        "hover:bg-muted text-foreground"
                      )}
                    >
                      <Edit className="h-3 w-3" />
                      Edit Course
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2",
                        "hover:bg-destructive/10 text-destructive"
                      )}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete Course
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* View Button */}
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

      {/* Hover Effect Border */}
      <div className={cn(
        "absolute inset-0 rounded-lg border-2 border-primary/20 opacity-0 transition-opacity pointer-events-none",
        "group-hover:opacity-100"
      )} />
    </div>
  );
}; 