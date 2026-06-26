import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Play,
  Save,
  RefreshCw,
  Settings,
  Lightbulb,
  Eye
} from 'lucide-react';
import { SimpleLoader } from '@/components';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { TopicLearningDialog } from '../components/TopicLearningDialog';
import { motion, AnimatePresence } from 'framer-motion';

interface SyllabusUnit {
  unit: number;
  title: string;
  topics: string[];
  description?: string;
}

export function UnitDetail() {
  const { courseId, unitNumber } = useParams<{ courseId: string; unitNumber: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const { course, loading, error } = useCourseDetail(courseId);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isLearningDialogOpen, setIsLearningDialogOpen] = useState(false);

  const unitNum = parseInt(unitNumber || '1');
  const currentUnit = course?.syllabus_json?.units?.find((unit: SyllabusUnit) => unit.unit === unitNum);

  const handleBack = () => {
    navigate(`/courses/${courseId}`);
  };

  const toggleTopic = (topic: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topic)) {
      newExpanded.delete(topic);
    } else {
      newExpanded.add(topic);
    }
    setExpandedTopics(newExpanded);
  };

  const handleLearnTopic = (topic: string) => {
    setSelectedTopic(topic);
    setIsLearningDialogOpen(true);
  };

  if (loading) {
    return <SimpleLoader text="Loading unit details..." />;
  }

  if (error || !course || !currentUnit) {
    return (
      <div className="w-full pt-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-destructive text-center">
            <h3 className="text-lg font-semibold mb-2">Unit not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The requested unit could not be found or the course data is not available.
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TopicCard = ({ topic, index }: { topic: string; index: number }) => {
    const isExpanded = expandedTopics.has(topic);
    
    return (
      <div className="mb-4">
        <div className="flex items-center gap-3">
          {/* Toggle button for topic details */}
          <button
            onClick={() => toggleTopic(topic)}
            className={cn(
              "flex-1 flex items-center gap-3 p-4 rounded-lg border transition-all duration-200",
              "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
              isDark 
                ? "bg-background/50 border-border/50 hover:bg-background/70" 
                : "bg-background/80 border-border hover:bg-background"
            )}
          >
            <div className="flex-1 text-left">
              <h4 className="font-medium text-foreground">{topic}</h4>
              <p className="text-xs text-muted-foreground mt-1">Topic {index + 1}</p>
            </div>
            
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
          
          {/* Learn button for topic */}
          <button
            onClick={() => handleLearnTopic(topic)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              "shadow-sm hover:shadow-md"
            )}
            title={`Learn about ${topic}`}
          >
            <Lightbulb className="h-4 w-4" />
            <span className="text-sm font-medium">Learn</span>
          </button>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 ml-8 border-l-2 border-border/30">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This topic is part of Unit {unitNum} in {course.course_name}. 
                    Click the "Learn" button to get detailed explanations, examples, and practice materials.
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLearnTopic(topic)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all",
                        "bg-accent text-accent-foreground hover:bg-accent/80",
                        "focus:outline-none focus:ring-2 focus:ring-accent/20"
                      )}
                    >
                      <Play className="h-3 w-3" />
                      Start Learning
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in-50 duration-300 slide-in-from-bottom-2 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/20"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Course</span>
        </button>
      </div>

      {/* Unit Header */}
      <div className={cn(
        "px-6 py-8 rounded-xl mb-6 border",
        "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-full",
            isDark ? "bg-primary/20" : "bg-primary/10"
          )}>
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Unit {unitNum}
            </h1>
            {currentUnit.title && (
              <h2 className="text-xl text-muted-foreground mb-3">
                {currentUnit.title}
              </h2>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Course: {course.course_name}</span>
              <span>•</span>
              <span>{currentUnit.topics.length} Topics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">Topics to Learn</h3>
          <span className="text-sm text-muted-foreground">
            {currentUnit.topics.length} topic{currentUnit.topics.length !== 1 ? 's' : ''} available
          </span>
        </div>

        <div className="space-y-3">
          {currentUnit.topics.map((topic: string, index: number) => (
            <TopicCard key={topic} topic={topic} index={index} />
          ))}
        </div>
      </div>

      {/* Topic Learning Dialog */}
      <TopicLearningDialog
        isOpen={isLearningDialogOpen}
        onClose={() => {
          setIsLearningDialogOpen(false);
          setSelectedTopic(null);
        }}
        topic={selectedTopic}
        unitNumber={unitNum}
        courseName={course.course_name}
        courseId={courseId}
      />
    </div>
  );
}

export default UnitDetail; 