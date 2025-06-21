import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Loader2, Bot, User, Eye, Clock } from "lucide-react";
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "motion/react";
import { useHandbook } from '../hooks/useHandbook';
import { useHandbookFiles } from '../hooks/useHandbookFiles';
import { HandbookUpload } from './HandbookUpload';
import { AIResponse } from '@/components/ui';
import { 
  processHandbookQuery, 
  getSuggestedQuestions 
} from '../lib/handbookQuery';
import type { QueryResponse } from '../lib/handbookQuery';

interface HandbookQueryProps {
  userId: string;
  academicId: string;
}

export function HandbookQuery({
  userId,
  academicId,
}: HandbookQueryProps) {
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [handbookStatus, setHandbookStatus] = useState<string | null>(null);
  const [viewingHandbook, setViewingHandbook] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const { 
    handbookExists, 
    loading: checkingHandbook, 
    refreshHandbook 
  } = useHandbook(userId);

  const { 
    handbooks, 
    loading: loadingHandbooks, 
    openHandbook 
  } = useHandbookFiles(userId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  useEffect(() => {
    const checkHandbookStatus = async () => {
      if (handbookExists) {
        try {
          const { getUserHandbook } = await import('../lib/handbook');
          const handbook = await getUserHandbook(userId);
          setHandbookStatus(handbook?.processing_status || null);
        } catch (err) {
          console.error('Error checking handbook status:', err);
        }
      }
    };

    checkHandbookStatus();
  }, [handbookExists, userId, refreshHandbook]);  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading || !handbookExists) return;

    setLoading(true);
    const currentQuestion = question.trim();
    setQuestion("");

    try {
      const result = await processHandbookQuery(currentQuestion, userId, handbookExists);
      
      if (result.success && result.userResponse && result.botResponse) {
        setResponses((prev) => [...prev, result.userResponse!, result.botResponse!]);
      } else if (result.userResponse && result.botResponse) {
        setResponses((prev) => [...prev, result.userResponse!, result.botResponse!]);
      } else if (result.error) {
        const userResponse: QueryResponse = {
          id: Date.now().toString(),
          question: currentQuestion,
          answer: "",
          timestamp: new Date().toISOString(),
        };
        
        const errorResponse: QueryResponse = {
          id: (Date.now() + 1).toString(),
          question: "",
          answer: result.error,
          timestamp: new Date().toISOString(),
        };
        
        setResponses((prev) => [...prev, userResponse, errorResponse]);
      }
    } catch (err) {
      console.error('Query error:', err);
      const userResponse: QueryResponse = {
        id: Date.now().toString(),
        question: currentQuestion,
        answer: "",
        timestamp: new Date().toISOString(),
      };
      
      const errorResponse: QueryResponse = {
        id: (Date.now() + 1).toString(),
        question: "",
        answer: err instanceof Error ? err.message : "Sorry, there was an error processing your question. Please try again.",
        timestamp: new Date().toISOString(),
      };
      
      setResponses((prev) => [...prev, userResponse, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleUploadSuccess = () => {
    refreshHandbook();
  };

  const handleSuggestedQuestion = (suggestedQuestion: string) => {
    setQuestion(suggestedQuestion);
  };

  const handleViewHandbook = async (handbook: any) => {
    setViewingHandbook(handbook.handbook_id);
    try {
      await openHandbook(handbook);
    } finally {
      setViewingHandbook(null);
    }
  };

  if (checkingHandbook) {
    return (
      <div className="bg-background border border-border rounded-xl h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking handbook status...</p>
        </div>
      </div>
    );
  }

  if (handbookExists === false) {
    return (
      <HandbookUpload
        userId={userId}
        academicId={academicId}
        onUploadSuccess={handleUploadSuccess}
      />
    );
  }

  const suggestedQuestions = getSuggestedQuestions();

  return (
    <div className="bg-background border border-border rounded-xl h-full flex flex-col">
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            isDark ? "bg-primary/10" : "bg-primary/5",
          )}>
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Ask Your Handbook</h3>
        </div>

        {/* Handbook Files Quick Access */}
        {handbookExists && handbooks.length > 0 && (
          <div className="flex items-center space-x-2">
            {handbooks.slice(0, 1).map((handbook) => (
              <button
                key={handbook.handbook_id}
                onClick={() => handleViewHandbook(handbook)}
                disabled={viewingHandbook === handbook.handbook_id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {viewingHandbook === handbook.handbook_id ? (
                  <>
                    <Clock className="h-3 w-3 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    View PDF
                  </>
                )}
              </button>
            ))}
            {handbooks.length > 1 && (
              <span className="text-xs text-muted-foreground">
                +{handbooks.length - 1} more
              </span>
            )}
          </div>
        )}
      </div>

      {handbookStatus && handbookStatus !== 'completed' && (
        <div className="mx-6 mb-4">
          <div className={cn(
            "p-3 rounded-lg border",
            handbookStatus === 'uploaded' || handbookStatus === 'processing'
              ? isDark 
                ? "bg-blue-950/50 border-blue-800 text-blue-200"
                : "bg-blue-50 border-blue-200 text-blue-800"
              : isDark
                ? "bg-red-950/50 border-red-800 text-red-200"
                : "bg-red-50 border-red-200 text-red-800"
          )}>
            <div className="flex items-center space-x-2">
              {handbookStatus === 'uploaded' || handbookStatus === 'processing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {handbookStatus === 'uploaded' && "Processing handbook..."}
                {handbookStatus === 'processing' && "Processing handbook..."}
                {handbookStatus === 'failed' && "Processing failed"}
              </span>
            </div>
            <p className="text-xs mt-1">
              {handbookStatus === 'uploaded' && "Your handbook is being analyzed. This may take a few minutes."}
              {handbookStatus === 'processing' && "Your handbook is currently being processed. Please wait."}
              {handbookStatus === 'failed' && "There was an error processing your handbook. Please try re-uploading."}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 px-6 pr-4 min-h-0">
        <AnimatePresence>
          {responses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Start a conversation with your handbook</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ask questions about rules, policies, procedures, and more
              </p>
                            
              <div className="mt-6">
                <p className="text-sm font-medium text-foreground mb-3">Try asking:</p>
                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                  {suggestedQuestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(suggestion)}
                      disabled={handbookStatus !== 'completed'}
                      className={cn(
                        "text-xs px-3 py-2 rounded-lg text-left transition-colors",
                        "border border-border hover:border-primary/50",
                        "hover:bg-primary/5 text-muted-foreground hover:text-foreground",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border"
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {responses.map((response, index) => (
            <motion.div
              key={response.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {response.question && (
                <div className="flex justify-end mb-4">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className={cn(
                      "p-3 rounded-2xl rounded-tr-md",
                      isDark ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"
                    )}>
                      <p className="text-sm">{response.question}</p>
                    </div>
                    <div className={cn(
                      "p-1.5 rounded-full mt-1",
                      isDark ? "bg-primary/20" : "bg-primary/10"
                    )}>
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              )}

              {response.answer && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className={cn(
                      "p-1.5 rounded-full mt-1",
                      isDark ? "bg-muted/40" : "bg-muted/30"
                    )}>
                      <Bot className="h-4 w-4 text-foreground" />
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl rounded-tl-md",
                      isDark ? "bg-muted/40" : "bg-muted/30"
                    )}>
                      <AIResponse>{response.answer}</AIResponse>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(response.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-4"
            >
              <div className="flex items-start space-x-3">
                <div className={cn(
                  "p-1.5 rounded-full mt-1",
                  isDark ? "bg-muted/40" : "bg-muted/30"
                )}>
                  <Bot className="h-4 w-4 text-foreground" />
                </div>
                <div className={cn(
                  "p-3 rounded-2xl rounded-tl-md",
                  isDark ? "bg-muted/40" : "bg-muted/30"
                )}>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Searching handbook...
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
            
      <div className="border-t border-border p-6 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  handbookStatus !== 'completed'
                    ? "Handbook is being processed..."
                    : "Ask about attendance policy, exam rules, CGPA calculation..."
                }
                disabled={loading || handbookStatus !== 'completed'}
                rows={1}
                className={cn(
                  "w-full px-4 py-3 pr-12 border border-border rounded-xl resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "disabled:bg-muted disabled:cursor-not-allowed",
                  "bg-background text-foreground placeholder:text-muted-foreground"
                )}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={loading || !question.trim() || handbookStatus !== 'completed'}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "p-2 rounded-lg transition-colors",
                  "hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Send className="h-5 w-5 text-primary" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 
