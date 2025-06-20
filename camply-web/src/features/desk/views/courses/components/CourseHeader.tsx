import { BookOpen, Hash, Award, Eye } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';

interface CourseHeaderProps {
  course: {
    course_name: string;
    course_code?: string | null;
    course_type: 'theory' | 'lab';
    credits?: number | null;
    syllabus_storage_path?: string | null;
  };
  onViewSyllabus?: () => void;
}

export function CourseHeader({ course, onViewSyllabus }: CourseHeaderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div 
      className="relative h-80 -mt-6 mb-6 overflow-hidden"
      style={{ 
        width: 'calc(100% + 50px)', 
        marginLeft: '-25px',
      }}
    >
      <div 
        className="absolute inset-0"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)'
            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.foreground/0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-30" />
      
      <div className="relative z-10 flex items-center justify-between h-full p-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {course.course_name}  ({course.course_code})
              </h1>
              <p className="text-lg text-muted-foreground">
                {course.course_type[0].toUpperCase() + course.course_type.slice(1)}
              </p>
              <p className="text-lg text-muted-foreground">
                {course.credits === 1 ? 'Credit' : 'Credits'} - {course.credits} 
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-lg">
            <div className="flex items-center gap-2">
                <span className="text-foreground capitalize"></span>
            </div>
            
            {course.credits && (
              <div className="flex items-center gap-2">
                <span className="text-foreground"> </span>
              </div>
            )}
          </div>
        </div>

        {course.syllabus_storage_path && onViewSyllabus && (
          <div className="flex-shrink-0">
            <button
              onClick={onViewSyllabus}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
            >
              <Eye className="h-5 w-5" />
              View Syllabus
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 