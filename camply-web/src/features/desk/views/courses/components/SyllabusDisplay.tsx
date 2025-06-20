import { useState } from 'react';
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
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export const SyllabusDisplay = ({ syllabusData, className }: SyllabusDisplayProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

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

  const UnitToggle = ({ unit }: { unit: SyllabusUnit }) => {
    const isExpanded = expandedUnits.has(unit.unit);
    
    return (
      <div className="mb-4">
        <button
          onClick={() => toggleUnit(unit.unit)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
            "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
            isDark 
              ? "bg-background/50 border-border/50 hover:bg-background/70" 
              : "bg-background/80 border-border hover:bg-background"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md text-sm font-bold",
            isDark ? "bg-muted text-foreground" : "bg-muted/70 text-foreground"
          )}>
            {unit.unit}
          </div>
          
          <div className="flex-1 text-left">
            <h4 className="font-medium text-foreground">{unit.title}</h4>
            {unit.description && !isExpanded && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {unit.description}
              </p>
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
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 ml-8 border-l-2 border-border/30 space-y-3">
                {unit.description && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Description</h5>
                    <p className="text-sm text-foreground leading-relaxed">
                      {unit.description}
                    </p>
                  </div>
                )}
                
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-3">Topics Covered</h5>
                  <div className="space-y-2">
                    {unit.topics.map((topic, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground leading-relaxed">
                          {topic}
                        </span>
                      </div>
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
    <div className={cn("w-full space-y-6", className)}>
      {/* Course Overview */}
      <SectionToggle 
        id="overview" 
        title="Course Overview" 
        icon={BookOpen}
        defaultExpanded={true}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-medium text-foreground mb-2">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {syllabusData.course_description}
            </p>
          </div>
          
          {syllabusData.metadata && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {syllabusData.metadata.credits && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">
                    <strong>Credits:</strong> {syllabusData.metadata.credits}
                  </span>
                </div>
              )}
              
              {syllabusData.metadata.duration_hours && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">
                    <strong>Duration:</strong> {syllabusData.metadata.duration_hours} hours
                  </span>
                </div>
              )}
              
              {syllabusData.metadata.prerequisites && (
                <div className="md:col-span-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-sm text-foreground">
                      <strong>Prerequisites:</strong> {syllabusData.metadata.prerequisites}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionToggle>

      {/* Learning Outcomes */}
      <SectionToggle 
        id="outcomes" 
        title="Learning Outcomes" 
        icon={Target}
      >
        <div className="space-y-3">
          {syllabusData.learning_outcomes.map((outcome, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5",
                isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
              )}>
                {index + 1}
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {outcome}
              </p>
            </div>
          ))}
        </div>
      </SectionToggle>

      {/* Course Units */}
      <SectionToggle 
        id="units" 
        title={`Course Units (${syllabusData.units.length})`}
        icon={FileText}
      >
        <div className="space-y-4">
          {syllabusData.units.map((unit) => (
            <UnitToggle key={unit.unit} unit={unit} />
          ))}
        </div>
      </SectionToggle>

      {/* Evaluation Scheme */}
      {syllabusData.metadata?.evaluation_scheme && (
        <SectionToggle 
          id="evaluation" 
          title="Evaluation Scheme" 
          icon={Lightbulb}
        >
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {syllabusData.metadata.evaluation_scheme}
            </p>
          </div>
        </SectionToggle>
      )}

      {/* Processing Info */}
      {syllabusData.processing_timestamp && (
        <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border/30">
          Processed on {new Date(syllabusData.processing_timestamp).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}; 