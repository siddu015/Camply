import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { 
  X, 
  Settings, 
  Send, 
  RefreshCw, 
  Save, 
  BookOpen,
  Lightbulb,
  CheckCircle,
  Loader2,
  Download,
  Copy,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIResponse } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface PromptOption {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

interface TopicLearningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string | null;
  unitNumber: number;
  courseName: string;
  courseId?: string;
}

interface LearningResponse {
  id: string;
  content: string;
  timestamp: Date;
  saved: boolean;
  promptOptions: PromptOption[];
}

const defaultPromptOptions: PromptOption[] = [
  {
    id: 'brief',
    label: 'Brief Answer',
    description: 'Get a concise, focused explanation',
    checked: false
  },
  {
    id: 'detailed',
    label: 'Detailed Explanation', 
    description: 'Comprehensive coverage with examples',
    checked: true
  },
  {
    id: 'examples',
    label: 'Include Examples',
    description: 'Add practical examples and use cases',
    checked: true
  },
  {
    id: 'diagrams',
    label: 'Visual Aids',
    description: 'Include diagrams and flowcharts when helpful',
    checked: false
  },
  {
    id: 'practice',
    label: 'Practice Questions',
    description: 'Add sample questions and exercises',
    checked: false
  },
  {
    id: 'realWorld',
    label: 'Real-world Applications',
    description: 'Show how this applies in industry/practice',
    checked: false
  },
  {
    id: 'prerequisites',
    label: 'Prerequisites',
    description: 'Explain required background knowledge',
    checked: false
  },
  {
    id: 'nextSteps',
    label: 'Next Steps',
    description: 'Suggest what to learn next',
    checked: false
  }
];

export const TopicLearningDialog = ({
  isOpen,
  onClose,
  topic,
  unitNumber,
  courseName,
  courseId
}: TopicLearningDialogProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [promptOptions, setPromptOptions] = useState<PromptOption[]>(defaultPromptOptions);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<LearningResponse[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [responseCache, setResponseCache] = useState<Map<string, LearningResponse>>(new Map());
  const responseEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    responseEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  useEffect(() => {
    if (isOpen && topic) {
      // Reset state when opening for new topic
      setResponses([]);
      setCustomPrompt('');
      setShowSettings(false);
    }
  }, [isOpen, topic]);

  const handlePromptOptionChange = (optionId: string) => {
    setPromptOptions(prev => 
      prev.map(option => 
        option.id === optionId 
          ? { ...option, checked: !option.checked }
          : option
      )
    );
  };

  const generateLearningContent = async () => {
    if (!topic || loading) return;

    // Check cache first
    const selectedOptions = promptOptions.filter(opt => opt.checked);
    const cacheKey = `${topic}-${selectedOptions.map(opt => opt.id).join(',')}-${customPrompt.trim()}`;
    
    if (responseCache.has(cacheKey)) {
      const cachedResponse = responseCache.get(cacheKey)!;
      setResponses(prev => [...prev, {
        ...cachedResponse,
        id: Date.now().toString(),
        timestamp: new Date()
      }]);
      return;
    }

    setLoading(true);
    
    try {
      // Build prompt based on selected options
      const optionsText = selectedOptions.map(opt => opt.label).join(', ');
      
      const requestBody = {
        message: `Learn about "${topic}" from Unit ${unitNumber} of ${courseName}`,
        course_id: courseId,
        topic: topic,
        unit_number: unitNumber,
        course_name: courseName,
        prompt_options: selectedOptions.map(opt => opt.id),
        custom_requirements: customPrompt.trim() || undefined,
        context: {
          learning_preferences: optionsText,
          custom_prompt: customPrompt.trim()
        }
      };

      // Get user session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      // Add user_id to request body as backend expects it there
      const requestBodyWithUser = {
        ...requestBody,
        user_id: session?.user?.id
      };
      
      const response = await fetch('http://localhost:8001/course/learn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBodyWithUser)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const newResponse: LearningResponse = {
          id: Date.now().toString(),
          content: data.response,
          timestamp: new Date(),
          saved: false,
          promptOptions: [...selectedOptions]
        };
        
        // Cache the response
        setResponseCache(prev => new Map(prev.set(cacheKey, newResponse)));
        setResponses(prev => [...prev, newResponse]);
      } else {
        throw new Error(data.error || 'Failed to generate learning content');
      }
    } catch (error) {
      console.error('Error generating learning content:', error);
      
      // Enhanced fallback with offline content
      const fallbackResponse: LearningResponse = {
        id: Date.now().toString(),
        content: `# ${topic} - Offline Learning Guide

⚠️ **Service Temporarily Unavailable** - Here's what I can help you with about **${topic}**:

## Quick Study Plan

### 📚 **Core Concepts to Focus On:**
- Definition and basic principles of ${topic}
- Key characteristics and properties
- Common applications and use cases
- Related concepts in ${courseName}

### 🔍 **Study Resources:**
1. **Course Materials** - Check Unit ${unitNumber} notes and slides
2. **Textbook Reference** - Look for chapter on ${topic}
3. **Online Resources** - Educational platforms often have explanations
4. **Practice Problems** - Work through examples related to ${topic}

### 💡 **Study Tips:**
- Break down complex concepts into smaller parts
- Create visual diagrams if applicable
- Practice explaining the concept in your own words
- Connect ${topic} to real-world applications

### 🎯 **Self-Assessment Questions:**
- What is the main purpose of ${topic}?
- How does ${topic} relate to other concepts in this unit?
- What are practical applications of ${topic}?
- What would happen if ${topic} wasn't used/applied?

**Try the learning system again in a moment for a personalized, comprehensive explanation!**`,
        timestamp: new Date(),
        saved: false,
        promptOptions: []
      };
      
      setResponses(prev => [...prev, fallbackResponse]);
    } finally {
      setLoading(false);
    }
  };

  const saveResponse = (responseId: string) => {
    setResponses(prev =>
      prev.map(response =>
        response.id === responseId
          ? { ...response, saved: true }
          : response
      )
    );
  };

  const copyResponse = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const regenerateResponse = () => {
    generateLearningContent();
  };

  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] rounded-xl border shadow-xl overflow-hidden",
          "bg-background border-border"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-primary/20" : "bg-primary/10"
            )}>
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Learn: {topic}</h2>
              <p className="text-sm text-muted-foreground">
                Unit {unitNumber} • {courseName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20"
              )}
              title="Customize learning preferences"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20"
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-medium text-foreground mb-4">Customize Your Learning Experience</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {promptOptions.map(option => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        option.checked 
                          ? "border-primary/50 bg-primary/5" 
                          : "border-border hover:border-primary/30",
                        "focus-within:ring-2 focus-within:ring-primary/20"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={option.checked}
                        onChange={() => handlePromptOptionChange(option.id)}
                        className="mt-1 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Additional Requirements</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Any specific requirements or questions about this topic?"
                    className={cn(
                      "w-full px-3 py-2 border border-border rounded-lg resize-none",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20",
                      "bg-background text-foreground placeholder:text-muted-foreground"
                    )}
                    rows={3}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex flex-col h-[60vh]">
          {/* Responses */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {responses.length === 0 ? (
              <div className="text-center py-12">
                <div className={cn(
                  "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                  isDark ? "bg-primary/20" : "bg-primary/10"
                )}>
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Learn</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Click "Generate" to get a personalized explanation of {topic}. 
                  Use the settings above to customize your learning experience.
                </p>
              </div>
            ) : (
              responses.map(response => (
                <div key={response.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Generated {response.timestamp.toLocaleTimeString()}</span>
                      {response.saved && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Saved
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyResponse(response.content)}
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:outline-none focus:ring-2 focus:ring-primary/20"
                        )}
                        title="Copy response"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      
                      {!response.saved && (
                        <button
                          onClick={() => saveResponse(response.id)}
                          className={cn(
                            "p-1.5 rounded transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-primary/20"
                          )}
                          title="Save response"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className={cn(
                    "p-4 rounded-lg border",
                    "bg-background border-border"
                  )}>
                    <AIResponse>{response.content}</AIResponse>
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-foreground">Generating personalized learning content...</span>
                </div>
              </div>
            )}
            
            <div ref={responseEndRef} />
          </div>

          {/* Action Bar */}
          <div className="border-t border-border p-6">
            <div className="flex items-center gap-3">
              <button
                onClick={generateLearningContent}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
                {responses.length === 0 ? 'Generate' : 'Generate New'}
              </button>
              
              {responses.length > 0 && (
                <button
                  onClick={regenerateResponse}
                  disabled={loading}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all",
                    "bg-accent text-accent-foreground hover:bg-accent/80",
                    "focus:outline-none focus:ring-2 focus:ring-accent/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </button>
              )}
              
              <div className="flex-1" />
              
              <span className="text-sm text-muted-foreground">
                {promptOptions.filter(opt => opt.checked).length} preferences selected
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 