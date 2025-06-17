import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Loader2, Book, Bot, User } from "lucide-react";
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "motion/react";

interface HandbookQueryProps {
  userId: string;
  disabled?: boolean;
}

interface QueryResponse {
  question: string;
  answer: string;
  timestamp: string;
  id: string;
}

export function HandbookQuery({
  userId,
  disabled = false,
}: HandbookQueryProps) {
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading || disabled) return;

    setLoading(true);
    const currentQuestion = question.trim();
    setQuestion("");

    // Add user message immediately
    const userResponse: QueryResponse = {
      id: Date.now().toString(),
      question: currentQuestion,
      answer: "",
      timestamp: new Date().toISOString(),
    };

    setResponses((prev) => [...prev, userResponse]);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/query-handbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          user_id: userId,
        }),
      });

      const data = await response.json();

      const botResponse: QueryResponse = {
        id: (Date.now() + 1).toString(),
        question: "",
        answer: data.answer || "Sorry, I could not find information about that in your handbook.",
        timestamp: new Date().toISOString(),
      };

      setResponses((prev) => [...prev, botResponse]);
    } catch (err) {
      const errorResponse: QueryResponse = {
        id: (Date.now() + 1).toString(),
        question: "",
        answer: "Sorry, there was an error processing your question. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setResponses((prev) => [...prev, errorResponse]);
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

  return (
    <div className="bg-background border border-border rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-6">
        <div className={cn(
          "p-2 rounded-lg",
          isDark ? "bg-primary/10" : "bg-primary/5",
        )}>
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Ask Your Handbook</h3>
      </div>

      {disabled && (
        <div className={cn(
          "p-4 rounded-lg mb-6 text-center",
          isDark ? "bg-muted/30" : "bg-muted/20"
        )}>
          <Book className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">Upload and process a handbook first</p>
          <p className="text-sm text-muted-foreground mt-1">
            Once your handbook is processed, you can ask questions about it here.
          </p>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 min-h-[300px] max-h-[400px] pr-2">
        <AnimatePresence>
          {responses.length === 0 && !disabled && (
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
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {response.answer}
                      </p>
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

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                disabled
                  ? "Upload and process a handbook first"
                  : "Ask a question about your handbook..."
              }
              disabled={disabled || loading}
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
              disabled={disabled || loading || !question.trim()}
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

        {!disabled && (
          <div className="text-xs text-muted-foreground">
            <p>💡 <strong>Try asking:</strong> "What is the attendance policy?" or "How is CGPA calculated?"</p>
          </div>
        )}
      </form>
    </div>
  );
} 