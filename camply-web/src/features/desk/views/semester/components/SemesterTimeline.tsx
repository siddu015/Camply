import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { Calendar, Clock, FileText, Play, Square, TrendingUp, CheckCircle, BookOpen, Target, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Semester } from '../types';

interface TimelineEvent {
  date: string;
  label: string;
  shortLabel: string;
  type: 'start' | 'assessment' | 'exam' | 'end';
  isCompleted: boolean;
  isCurrent: boolean;
  position: number; // Position percentage on timeline (0-100)
  daysFromStart: number;
}

interface StudySection {
  id: string;
  title: string;
  description: string;
  type: 'ia1' | 'ia2' | 'sem_exam';
  status: 'upcoming' | 'current' | 'completed';
  daysRemaining: number;
  actionText: string;
}

interface SemesterTimelineProps {
  semester: Semester;
}

const TimelineMilestone = ({ event }: { event: TimelineEvent }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const getEventIcon = () => {
    switch (event.type) {
      case 'start':
        return <Play className="h-3 w-3" />;
      case 'assessment':
        return <Clock className="h-3 w-3" />;
      case 'exam':
        return <FileText className="h-3 w-3" />;
      case 'end':
        return <Square className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const getEventStyles = () => {
    if (event.isCompleted) {
      return {
        container: 'bg-green-500 border-green-400 text-white',
        dot: 'bg-green-500',
        label: 'text-green-600'
      };
    }
    
    if (event.isCurrent) {
      return {
        container: 'bg-blue-500 border-blue-400 text-white',
        dot: 'bg-blue-500',
        label: 'text-blue-600'
      };
    }
    
    return {
      container: 'bg-muted border-border text-muted-foreground',
      dot: 'bg-muted-foreground',
      label: 'text-muted-foreground'
    };
  };

  const styles = getEventStyles();

  return (
    <div className="flex flex-col items-center min-w-0">
      {/* Icon Circle */}
      <div className={cn(
        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
        styles.container,
        "shadow-lg hover:scale-110"
      )}>
        {event.isCompleted ? <CheckCircle className="h-3 w-3" /> : getEventIcon()}
      </div>
      
      {/* Event Label */}
      <div className="mt-2 text-center">
        <div className={cn("text-xs font-medium", styles.label)}>
          {event.shortLabel}
        </div>
        <div className="text-xs text-muted-foreground/75">
          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
};

const StudySectionCard = ({ section }: { section: StudySection }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const getSectionStyles = () => {
    switch (section.status) {
      case 'current':
        return {
          border: 'border-blue-500/30',
          background: 'bg-blue-500/5',
          icon: 'text-blue-500',
          iconBg: 'bg-blue-500/10',
          title: 'text-blue-600',
          urgency: 'text-blue-600'
        };
      case 'upcoming':
        return {
          border: 'border-orange-500/30',
          background: 'bg-orange-500/5',
          icon: 'text-orange-500',
          iconBg: 'bg-orange-500/10',
          title: 'text-orange-600',
          urgency: 'text-orange-600'
        };
      case 'completed':
        return {
          border: 'border-green-500/30',
          background: 'bg-green-500/5',
          icon: 'text-green-500',
          iconBg: 'bg-green-500/10',
          title: 'text-green-600',
          urgency: 'text-green-600'
        };
      default:
        return {
          border: 'border-border',
          background: 'bg-muted/5',
          icon: 'text-muted-foreground',
          iconBg: 'bg-muted/10',
          title: 'text-foreground',
          urgency: 'text-muted-foreground'
        };
    }
  };

  const styles = getSectionStyles();
  const isActive = section.status === 'current' || (section.status === 'upcoming' && section.daysRemaining <= 14);

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all duration-300",
      styles.background,
      styles.border,
      isActive && "ring-2 ring-current/20"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-lg",
          styles.iconBg
        )}>
          <BookOpen className={cn("h-5 w-5", styles.icon)} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className={cn("font-semibold text-lg", styles.title)}>
              {section.title}
            </h3>
            {section.status !== 'completed' && (
              <div className="flex items-center gap-2">
                <Target className={cn("h-4 w-4", styles.urgency)} />
                <span className={cn("text-sm font-medium", styles.urgency)}>
                  {section.daysRemaining > 0 ? `${section.daysRemaining} days` : 'Today'}
                </span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {section.description}
          </p>
          
          <button className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            "border border-current/20 hover:border-current/40",
            styles.background,
            styles.title,
            "hover:shadow-md"
          )}>
            {section.actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SemesterTimeline = ({ semester }: SemesterTimelineProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for real-time progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const calculateRealTimeProgress = (events: TimelineEvent[]): { progress: number; daysElapsed: number; totalDays: number; status: string } => {
    if (!semester.start_date || !semester.end_date) {
      return { progress: 0, daysElapsed: 0, totalDays: 0, status: 'No dates set' };
    }
    
    const startDate = new Date(semester.start_date);
    const endDate = new Date(semester.end_date);
    const now = currentTime;
    
    // Calculate total duration in days
    const totalDuration = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
    
    if (now < startDate) {
      const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        progress: 0, 
        daysElapsed: 0, 
        totalDays, 
        status: `Starts in ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'}` 
      };
    }
    
    if (now > endDate) {
      return { 
        progress: 100, 
        daysElapsed: totalDays, 
        totalDays, 
        status: 'Completed' 
      };
    }
    
    // Calculate elapsed time
    const elapsed = now.getTime() - startDate.getTime();
    const daysElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    
    // Calculate progress aligned with milestones
    let progress = 0;
    
    // Find the current position relative to milestones
    for (let i = 0; i < events.length - 1; i++) {
      const currentEvent = events[i];
      const nextEvent = events[i + 1];
      
      const currentEventDate = new Date(currentEvent.date);
      const nextEventDate = new Date(nextEvent.date);
      
      if (now >= currentEventDate && now <= nextEventDate) {
        // We're between two events - interpolate the progress
        const segmentDuration = nextEventDate.getTime() - currentEventDate.getTime();
        const segmentElapsed = now.getTime() - currentEventDate.getTime();
        const segmentProgress = segmentElapsed / segmentDuration;
        
        // Calculate progress based on milestone positions
        const currentPosition = currentEvent.position;
        const nextPosition = nextEvent.position;
        progress = currentPosition + (segmentProgress * (nextPosition - currentPosition));
        break;
      } else if (now >= nextEventDate) {
        // We've passed this milestone
        progress = nextEvent.position;
      }
    }
    
    progress = Math.min(100, Math.max(0, progress));
    
    return { 
      progress, 
      daysElapsed, 
      totalDays, 
      status: `Day ${daysElapsed + 1} of ${totalDays}` 
    };
  };

  const createTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    if (!semester.start_date || !semester.end_date) return events;
    
    const startDate = new Date(semester.start_date);
    const endDate = new Date(semester.end_date);
    const totalDuration = endDate.getTime() - startDate.getTime();
    const now = currentTime;

    const calculateEventData = (eventDate: string, label: string, shortLabel: string, type: TimelineEvent['type']) => {
      const eventTime = new Date(eventDate);
      const elapsed = eventTime.getTime() - startDate.getTime();
      const position = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      const daysFromStart = Math.ceil(elapsed / (1000 * 60 * 60 * 24));
      
      // Check if event is current (within ±2 days)
      const daysDifference = Math.abs((eventTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isCurrent = daysDifference <= 2 && eventTime >= now;
      
      return {
        date: eventDate,
        label,
        shortLabel,
        type,
        isCompleted: eventTime < now,
        isCurrent,
        position,
        daysFromStart
      };
    };

    // Semester start
    events.push(calculateEventData(
      semester.start_date,
      'Semester Begins',
      'Start',
      'start'
    ));

    // IA-1
    if (semester.ia1_date) {
      events.push(calculateEventData(
        semester.ia1_date,
        'Internal Assessment - 1',
        'IA-1',
        'assessment'
      ));
    }

    // IA-2
    if (semester.ia2_date) {
      events.push(calculateEventData(
        semester.ia2_date,
        'Internal Assessment - 2',
        'IA-2',
        'assessment'
      ));
    }

    // Semester exam
    if (semester.sem_exam_date) {
      events.push(calculateEventData(
        semester.sem_exam_date,
        'Semester End Examination',
        'Final Exam',
        'exam'
      ));
    }

    // Semester end
    events.push(calculateEventData(
      semester.end_date,
      'Semester Ends',
      'End',
      'end'
    ));

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const createStudySections = (): StudySection[] => {
    const sections: StudySection[] = [];
    const now = currentTime;

    // Helper function to calculate days until date
    const daysUntil = (dateStr: string) => {
      const targetDate = new Date(dateStr);
      return Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Helper function to determine status
    const getStatus = (dateStr: string, bufferDays: number = 14): StudySection['status'] => {
      const days = daysUntil(dateStr);
      if (days < 0) return 'completed';
      if (days <= bufferDays) return 'current';
      return 'upcoming';
    };

    // IA-1 Study Section
    if (semester.ia1_date) {
      const days = daysUntil(semester.ia1_date);
      sections.push({
        id: 'ia1-study',
        title: 'Time to Study for IA-1',
        description: 'Prepare for your first internal assessment. Upload your timetable to get a personalized study plan.',
        type: 'ia1',
        status: getStatus(semester.ia1_date),
        daysRemaining: Math.max(0, days),
        actionText: days < 0 ? 'Upload IA-1 Results' : 'Create Study Plan'
      });
    }

    // IA-2 Study Section
    if (semester.ia2_date) {
      const days = daysUntil(semester.ia2_date);
      const ia1Completed = semester.ia1_date ? daysUntil(semester.ia1_date) < 0 : false;
      
      sections.push({
        id: 'ia2-study',
        title: 'Time to Study for IA-2',
        description: ia1Completed 
          ? 'Analyze your IA-1 performance and prepare better for IA-2. Upload your timetable for optimized preparation.'
          : 'Prepare for your second internal assessment with improved strategies.',
        type: 'ia2',
        status: getStatus(semester.ia2_date),
        daysRemaining: Math.max(0, days),
        actionText: days < 0 ? 'Upload IA-2 Results' : ia1Completed ? 'Analyze & Plan IA-2' : 'Create Study Plan'
      });
    }

    // Semester End Exam Study Section
    if (semester.sem_exam_date) {
      const days = daysUntil(semester.sem_exam_date);
      const ia2Completed = semester.ia2_date ? daysUntil(semester.ia2_date) < 0 : false;
      
      sections.push({
        id: 'sem-exam-study',
        title: 'Time to Study for Semester End Exam',
        description: ia2Completed
          ? 'Final preparation! Analyze your IA performance and create a comprehensive semester exam strategy.'
          : 'Prepare for your final semester examination with a complete study plan.',
        type: 'sem_exam',
        status: getStatus(semester.sem_exam_date, 14), // 2 weeks buffer for final exam
        daysRemaining: Math.max(0, days),
        actionText: days < 0 ? 'Upload Marksheet' : 'Create Final Exam Plan'
      });
    }

    return sections.filter(section => 
      section.status === 'current' || 
      (section.status === 'upcoming' && section.daysRemaining <= 30) ||
      (section.status === 'completed' && section.daysRemaining >= -7) // Show completed for 1 week
    );
  };

  const timelineEvents = createTimelineEvents();
  const { progress, daysElapsed, totalDays, status } = calculateRealTimeProgress(timelineEvents);
  const studySections = createStudySections();

  if (timelineEvents.length === 0) {
    return (
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            Semester Timeline
          </h2>
        </div>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No timeline data available</p>
          <p className="text-xs text-muted-foreground/75 mt-2">
            Add semester dates to see your progress
          </p>
        </div>
      </div>
    );
  }

  const nextEvent = timelineEvents.find(event => !event.isCompleted);

  return (
    <div className="space-y-6 pb-8">
      {/* Main Timeline */}
      <div className="bg-background border border-border rounded-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-all duration-300",
              isDark ? "bg-gradient-to-br from-primary/20 to-primary/10" : "bg-gradient-to-br from-primary/10 to-primary/5"
            )}>
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Semester Timeline
              </h2>
              <p className="text-sm text-muted-foreground">
                Real-time semester progress and milestones
              </p>
            </div>
          </div>
          
          {/* Live Progress Display */}
          <div className="text-right">
            <div className={cn(
              "text-3xl font-bold transition-colors duration-300",
              progress >= 100 ? "text-green-500" :
              progress >= 75 ? "text-blue-500" :
              progress >= 50 ? "text-yellow-500" :
              "text-orange-500"
            )}>
              {progress.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {status}
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-foreground">{daysElapsed}</div>
            <div className="text-xs text-muted-foreground">Days Completed</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-foreground">{Math.max(0, totalDays - daysElapsed)}</div>
            <div className="text-xs text-muted-foreground">Days Remaining</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-foreground">{totalDays}</div>
            <div className="text-xs text-muted-foreground">Total Days</div>
          </div>
        </div>

        {/* Modern Progress Section */}
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="relative">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out relative",
                  "bg-gradient-to-r",
                  progress >= 100 ? "from-green-500 to-green-400" :
                  progress >= 75 ? "from-blue-500 to-blue-400" :
                  progress >= 50 ? "from-yellow-500 to-yellow-400" :
                  "from-orange-500 to-orange-400"
                )}
                style={{ width: `${progress}%` }}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
            
            {/* Current progress indicator */}
            {progress > 0 && progress < 100 && (
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10"
                style={{ left: `${progress}%` }}
              >
                <div className={cn(
                  "relative w-7 h-7 rounded-full border-3 transition-all duration-300",
                  "shadow-xl hover:scale-110",
                  isDark ? "bg-background border-opacity-90" : "bg-white border-opacity-90",
                  progress >= 75 ? "border-blue-500 shadow-blue-500/30" :
                  progress >= 50 ? "border-yellow-500 shadow-yellow-500/30" :
                  "border-orange-500 shadow-orange-500/30"
                )}>
                  {/* Glowing inner dot */}
                  <div className={cn(
                    "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
                    "w-3 h-3 rounded-full transition-all duration-300",
                    progress >= 75 ? "bg-blue-500 shadow-lg shadow-blue-500/50" :
                    progress >= 50 ? "bg-yellow-500 shadow-lg shadow-yellow-500/50" :
                    "bg-orange-500 shadow-lg shadow-orange-500/50"
                  )}></div>
                  
                  {/* Animated pulse ring */}
                  <div className={cn(
                    "absolute inset-0 rounded-full border-2 animate-ping opacity-30",
                    progress >= 75 ? "border-blue-400" :
                    progress >= 50 ? "border-yellow-400" :
                    "border-orange-400"
                  )}></div>
                  
                  {/* Outer glow effect */}
                  <div className={cn(
                    "absolute inset-0 rounded-full blur-sm opacity-20",
                    progress >= 75 ? "bg-blue-500" :
                    progress >= 50 ? "bg-yellow-500" :
                    "bg-orange-500"
                  )}></div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Milestones */}
          <div className="flex justify-between items-start">
            {timelineEvents.map((event, index) => (
              <TimelineMilestone 
                key={`${event.type}-${event.date}`}
                event={event} 
              />
            ))}
          </div>

          {/* Date Range */}
          <div className="flex justify-between text-sm text-muted-foreground border-t border-border pt-4">
            <div className="text-left">
              <div className="font-medium text-foreground">
                {new Date(semester.start_date!).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-xs">Semester Start</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-foreground">
                {currentTime.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric'
                })}
              </div>
              <div className="text-xs">Today</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-foreground">
                {new Date(semester.end_date!).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-xs">Semester End</div>
            </div>
          </div>
        </div>

        {/* Next Event Preview */}
        {nextEvent && (
          <div className={cn(
            "p-4 rounded-lg border border-dashed transition-all duration-300",
            "bg-blue-500/5 border-blue-500/20"
          )}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  Next: {nextEvent.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(nextEvent.date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">
                  {Math.ceil((new Date(nextEvent.date).getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
                <div className="text-xs text-muted-foreground">remaining</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Study Preparation Sections */}
      {studySections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Exam Preparation
            </h3>
          </div>
          
          <div className="grid gap-4">
            {studySections.map((section) => (
              <StudySectionCard key={section.id} section={section} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Export with old name for backward compatibility
export const AcademicTimeline = SemesterTimeline; 