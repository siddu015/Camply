import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Play, Square } from 'lucide-react';
import type { Semester } from '../types';

interface TimelineEvent {
  date: string;
  label: string;
  type: 'start' | 'assessment' | 'exam' | 'end';
  isCompleted: boolean;
  isCurrent: boolean;
}

interface AcademicTimelineProps {
  semester: Semester;
}

const TimelineEventCard = ({ event, isLast }: { event: TimelineEvent; isLast: boolean }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const getEventIcon = () => {
    switch (event.type) {
      case 'start':
        return <Play className="h-4 w-4" />;
      case 'assessment':
        return <Clock className="h-4 w-4" />;
      case 'exam':
        return <FileText className="h-4 w-4" />;
      case 'end':
        return <Square className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColors = () => {
    if (event.isCompleted) {
      return {
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-500',
        statusBg: 'bg-green-500/10',
        statusText: 'text-green-500',
        borderColor: 'border-green-500/20'
      };
    }
    
    if (event.isCurrent) {
      return {
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        statusBg: 'bg-blue-500/10',
        statusText: 'text-blue-500',
        borderColor: 'border-blue-500/20'
      };
    }
    
    return {
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      statusBg: 'bg-muted',
      statusText: 'text-muted-foreground',
      borderColor: 'border-border'
    };
  };

  const colors = getEventColors();

  return (
    <div className="relative flex items-center gap-4 pb-8 last:pb-0">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-6 top-12 w-0.5 h-8 bg-border"></div>
      )}
      
      {/* Timeline Icon */}
      <div className={cn(
        "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2",
        colors.iconBg,
        colors.borderColor
      )}>
        <div className={colors.iconColor}>
          {getEventIcon()}
        </div>
        
        {/* Status Indicator */}
        <div className={cn(
          "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center",
          colors.statusBg
        )}>
          {event.isCompleted ? (
            <CheckCircle className={cn("h-2.5 w-2.5", colors.statusText)} />
          ) : event.isCurrent ? (
            <AlertCircle className={cn("h-2.5 w-2.5", colors.statusText)} />
          ) : (
            <div className={cn("h-1.5 w-1.5 rounded-full", colors.statusText.replace('text-', 'bg-'))}></div>
          )}
        </div>
      </div>
      
      {/* Event Content */}
      <div className={cn(
        "flex-1 p-4 rounded-lg border",
        "bg-background border-border"
      )}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-foreground">{event.label}</h4>
          <span className={cn(
            "text-xs px-2 py-1 rounded-full font-medium",
            colors.statusBg,
            colors.statusText
          )}>
            {event.isCompleted ? 'Completed' : event.isCurrent ? 'Current' : 'Upcoming'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
};

export const AcademicTimeline = ({ semester }: AcademicTimelineProps) => {
  const now = new Date();

  const createTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    if (semester.start_date) {
      events.push({
        date: semester.start_date,
        label: 'Semester Begins',
        type: 'start',
        isCompleted: new Date(semester.start_date) < now,
        isCurrent: false
      });
    }

    if (semester.ia1_date) {
      const ia1Date = new Date(semester.ia1_date);
      events.push({
        date: semester.ia1_date,
        label: 'Internal Assessment - 1',
        type: 'assessment',
        isCompleted: ia1Date < now,
        isCurrent: ia1Date.toDateString() === now.toDateString()
      });
    }

    if (semester.ia2_date) {
      const ia2Date = new Date(semester.ia2_date);
      events.push({
        date: semester.ia2_date,
        label: 'Internal Assessment - 2',
        type: 'assessment',
        isCompleted: ia2Date < now,
        isCurrent: ia2Date.toDateString() === now.toDateString()
      });
    }

    if (semester.sem_exam_date) {
      const examDate = new Date(semester.sem_exam_date);
      events.push({
        date: semester.sem_exam_date,
        label: 'Semester End Examination',
        type: 'exam',
        isCompleted: examDate < now,
        isCurrent: examDate.toDateString() === now.toDateString()
      });
    }

    if (semester.end_date) {
      events.push({
        date: semester.end_date,
        label: 'Semester Ends',
        type: 'end',
        isCompleted: new Date(semester.end_date) < now,
        isCurrent: false
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const timelineEvents = createTimelineEvents();

  if (timelineEvents.length === 0) {
    return (
      <div className="bg-background border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          Academic Timeline
        </h2>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No timeline events available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
        <Calendar className="h-5 w-5 text-primary" />
        Academic Timeline
      </h2>
      
      <div className="space-y-0">
        {timelineEvents.map((event, index) => (
          <TimelineEventCard 
            key={`${event.type}-${event.date}`}
            event={event} 
            isLast={index === timelineEvents.length - 1}
          />
        ))}
      </div>
    </div>
  );
}; 