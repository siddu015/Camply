import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import type { TimelineItem } from '../types/academic';

interface AcademicTimelineProps {
  admissionYear: number | undefined;
  graduationYear: number | undefined;
  currentYear: number | null;
}

export const AcademicTimeline = ({ admissionYear, graduationYear, currentYear }: AcademicTimelineProps) => {
  
  if (!admissionYear || !graduationYear) {
    return null;
  }
  
  const totalYears = graduationYear - admissionYear;
  const currentProgress = currentYear || 0;
  const progressPercentage = Math.min(Math.max((currentProgress / totalYears) * 100, 0), 100);
  
  const timelineItems: TimelineItem[] = [];
  for (let i = 0; i <= totalYears; i++) {
    const year = admissionYear + i;
    const status = 
      currentYear === null ? 'upcoming' : 
      i < currentYear ? 'completed' :
      i === currentYear ? 'current' : 
      'upcoming';
        
    timelineItems.push({
      year,
      label: i === 0 ? 'Start' : i === totalYears ? 'Graduation' : `Year ${i}`,
      status
    });
  }
  
  return (
    <div className="bg-background border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary" />
        Academic Timeline
      </h2>
      
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium text-foreground">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute top-0 left-4 w-0.5 h-full bg-border" />
        
        <div className="space-y-6">
          {timelineItems.map((item, index) => (
            <div key={index} className="relative pl-12">
              <div className={cn(
                "absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center",
                item.status === 'completed' && "bg-primary/10",
                item.status === 'current' && "bg-primary/20",
                item.status === 'upcoming' && "bg-muted"
              )}>
                {item.status === 'completed' && <CheckCircle className="h-5 w-5 text-primary" />}
                {item.status === 'current' && <Circle className="h-5 w-5 text-primary" fill="currentColor" />}
                {item.status === 'upcoming' && <Circle className="h-5 w-5 text-muted-foreground" />}
              </div>
              
              <div className="pb-2">
                <div className={cn(
                  "text-base font-medium", 
                  item.status === 'completed' ? "text-foreground" : 
                  item.status === 'current' ? "text-primary" :
                  "text-muted-foreground"
                )}>
                  {item.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.year}
                  {item.status === 'current' && " (Current)"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 