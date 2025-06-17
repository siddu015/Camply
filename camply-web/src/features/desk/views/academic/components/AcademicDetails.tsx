import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { GraduationCap, BookOpen, School, Calendar, User as UserIcon, Hash } from 'lucide-react';
import type { User, UserAcademicDetails, College } from '@/types/database';

interface AcademicDetailCardProps {
  label: string;
  value: string | number | null | undefined;
  icon: React.ReactNode;
}

interface AcademicDetailsProps {
  user: User | null;
  academicDetails: UserAcademicDetails | null;
  college: College | null;
}

const AcademicDetailCard = ({ label, value, icon }: AcademicDetailCardProps) => {
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
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value || 'Not available'}</span>
      </div>
    </div>
  );
};

export const AcademicDetails = ({ user, academicDetails, college }: AcademicDetailsProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (!user || !academicDetails) {
    return (
      <div className="bg-background border border-border rounded-xl p-6">
        <p className="text-foreground">Academic details not available.</p>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-primary" />
        Academic Profile
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AcademicDetailCard 
          label="Name" 
          value={user.name} 
          icon={<UserIcon className={cn("h-5 w-5", isDark ? "text-primary" : "text-primary")} />}
        />
        
        <AcademicDetailCard 
          label="Roll Number" 
          value={academicDetails.roll_number} 
          icon={<Hash className={cn("h-5 w-5", isDark ? "text-primary" : "text-primary")} />}
        />
        
        <AcademicDetailCard 
          label="College/University" 
          value={college?.name} 
          icon={<School className={cn("h-5 w-5", isDark ? "text-primary" : "text-primary")} />}
        />
        
        <AcademicDetailCard 
          label="Department" 
          value={academicDetails.department_name} 
          icon={<BookOpen className={cn("h-5 w-5", isDark ? "text-primary" : "text-primary")} />}
        />
        
        <AcademicDetailCard 
          label="Branch" 
          value={academicDetails.branch_name} 
          icon={<GraduationCap className={cn("h-5 w-5", isDark ? "text-primary" : "text-primary")} />}
        />
        
        <AcademicDetailCard 
          label="Academic Period" 
          value={`${academicDetails.admission_year} - ${academicDetails.graduation_year}`} 
          icon={<Calendar className={cn("h-5 w-5", isDark ? "text-primary" : "text-primary")} />}
        />
      </div>
    </div>
  );
}; 