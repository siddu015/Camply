import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  CheckCircle, 
  Target,
  FileText,
  Calendar,
  Award,
  Info,
  Lightbulb,
  Play,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopicLearningDialog } from './TopicLearningDialog';

interface SyllabusUnit {
  unit: number;
  title: string;
  topics: string[];
  description?: string;
}

interface SyllabusData {
  course_name: string;
  units: SyllabusUnit[];
  learning_outcomes: string[];
  course_description: string;
  metadata?: {
    credits?: number;
    duration_hours?: number;
    prerequisites?: string;
    evaluation_scheme?: string;
  };
  processing_timestamp?: string;
  version?: string;
}

interface SyllabusDisplayProps {
  syllabusData: SyllabusData;
  className?: string;
  courseId?: string;
}

export const SyllabusDisplay = ({ syllabusData, className, courseId }: SyllabusDisplayProps) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [learningDialogOpen, setLearningDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<SyllabusUnit | null>(null);

  const toggleUnit = (unitNumber: number) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitNumber)) {
      newExpanded.delete(unitNumber);
    } else {
      newExpanded.add(unitNumber);
    }
    setExpandedUnits(newExpanded);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const SectionToggle = ({ 
    id, 
    title, 
    icon: Icon, 
    children, 
    defaultExpanded = false 
  }: {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(id)}
          className={cn(
            "w-full flex items-center gap-3 p-4 rounded-lg border transition-all duration-200",
            "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
            isDark 
              ? "bg-card/50 border-border hover:bg-card/70" 
              : "bg-card border-border hover:bg-card/80"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            isDark ? "bg-primary/20" : "bg-primary/10"
          )}>
            <Icon className="h-4 w-4 text-primary" />
          </div>
          
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-4 pl-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const handleLearnUnit = (unitNumber: number) => {
    const unit = syllabusData.units.find(u => u.unit === unitNumber);
    if (unit) {
      setSelectedUnit(unit);
      setLearningDialogOpen(true);
    }
  };

  const UnitToggle = ({ unit }: { unit: SyllabusUnit }) => {
    const isExpanded = expandedUnits.has(unit.unit);
    
    return (
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleUnit(unit.unit)}
            className={cn(
              "flex-1 flex items-center gap-3 p-4 rounded-lg border transition-all duration-200",
              "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
              isDark 
                ? "bg-background/50 border-border/50 hover:bg-background/70" 
                : "bg-background/80 border-border hover:bg-background"
            )}
          >
            <div className="flex-1 text-left">
              <h4 className="font-medium text-foreground">Unit-{unit.unit}</h4>
              {unit.title && (
                <p className="text-sm text-muted-foreground mt-1">{unit.title}</p>
              )}
            </div>
            
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
          
          {courseId && (
            <button
              onClick={() => handleLearnUnit(unit.unit)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                "shadow-sm hover:shadow-md"
              )}
              title="Learn this unit"
            >
              <Play className="h-4 w-4" />
              <span className="text-sm font-medium">Learn</span>
            </button>
          )}
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
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground mb-3">Topics:</h5>
                  <div className="flex flex-wrap gap-2">
                    {unit.topics.map((topic, index) => (
                      <span 
                        key={index}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs",
                          isDark 
                            ? "bg-primary/20 text-primary" 
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {topic}
                      </span>
                    ))}
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
    <>
      <div className={cn("w-full space-y-4", className)}>
        {syllabusData.units.map((unit) => (
          <UnitToggle key={unit.unit} unit={unit} />
        ))}
      </div>

      <TopicLearningDialog
        isOpen={learningDialogOpen}
        onClose={() => {
          setLearningDialogOpen(false);
          setSelectedUnit(null);
        }}
        topic={selectedUnit ? `Unit ${selectedUnit.unit}: ${selectedUnit.title}` : null}
        unitNumber={selectedUnit?.unit || 0}
        courseName={syllabusData.course_name}
        courseId={courseId}
      />
    </>
  );
}; 