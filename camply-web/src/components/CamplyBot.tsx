import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoRefresh, IoExpand, IoContract } from 'react-icons/io5';
import { useTheme } from '../lib/theme-provider';
import { cn } from '../features/sidebar/lib/utils';
import { CamplyBotService, type ChatMessage, type ChatRequest } from '../lib/camply-bot';
import { supabase } from '../lib/supabase';
import { useCampusData } from '../hooks/useCampusData';
import { MarkdownRenderer } from './MarkdownRenderer';
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input';

interface CamplyBotProps {
  className?: string;
}

export const CamplyBot: React.FC<CamplyBotProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [botStatus, setBotStatus] = useState({ isOnline: false, responseTime: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  // Get the actual theme state
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Get user context
  const { academicDetails, college } = useCampusData(session?.user?.id);
  const camplyBotService = CamplyBotService.getInstance();

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Get session and check bot status
  useEffect(() => {
    const initializeBot = async () => {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // Check bot status
      const isOnline = await camplyBotService.checkHealth();
      const status = camplyBotService.getStatus();
      setBotStatus({ 
        isOnline, 
        responseTime: status.responseTime || 0 
      });
    };

    initializeBot();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get contextual placeholders
  const getPlaceholders = useCallback(() => {
    const context = {
      college_name: college?.name,
      department: academicDetails?.department_name,
      branch: academicDetails?.branch_name,
    };
    
    return camplyBotService.getQuickSuggestions(context);
  }, [college, academicDetails]);

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };
    
    const loadingMessage: ChatMessage = {
      id: `loading_${Date.now()}`,
      text: "Thinking...",
      isUser: false,
      timestamp: new Date(),
      loading: true,
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Prepare context from user data
      const context: ChatRequest['context'] = {
        college_name: college?.name,
        department: academicDetails?.department_name,
        branch: academicDetails?.branch_name,
      };
      
      const response = await camplyBotService.sendMessage({
        message: inputValue,
        user_id: session?.user?.id,
        context,
      });
      
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        text: response.response,
        isUser: false,
        timestamp: new Date(),
      };
      
      // Remove loading message and add real response
      setMessages(prev => prev.filter(msg => !msg.loading).concat([botMessage]));
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => prev.filter(msg => !msg.loading).concat([errorMessage]));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Reset conversation
  const handleReset = () => {
    setMessages([]);
    camplyBotService.resetSession();
  };

  // Toggle expansion
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Close bot
  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Bot Trigger Button with Glass Effect */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-lg z-50",
          isDark ? "backdrop-blur-xl bg-white/5 border border-white/10" : "backdrop-blur-xl bg-white/10 border border-white/20",
          isDark ? "hover:bg-white/8 hover:border-white/15" : "hover:bg-white/15 hover:border-white/30",
          "hover:shadow-xl transition-all duration-300 hover:scale-110",
          "flex items-center justify-center group",
          "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/20 before:via-white/5 before:to-transparent before:pointer-events-none",
          "after:absolute after:inset-[1px] after:rounded-full after:bg-gradient-to-t after:from-transparent after:via-white/8 after:to-white/15 after:pointer-events-none",
          className
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <img 
          src="/logo.png" 
          alt="Camply AI" 
          className={cn(
            "w-6 h-6 relative z-10",
          )}
        />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for expanded view */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn("fixed inset-0 backdrop-blur-[3px] z-40", isDark ? "bg-black/40" : "bg-gray-500/50")}
                onClick={handleClose}
              />
            )}

            {/* Background overlay for better glass effect in light theme */}
            {isOpen && !isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "fixed z-30 rounded-3xl",
                  "bottom-20 right-2 w-full max-w-[440px] h-[620px]",
                  isDark ? "bg-transparent" : "bg-gray-400/8 backdrop-blur-[2px]"
                )}
              />
            )}

            {/* Chat Container with Realistic Liquid Glass Effect */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "fixed z-50 rounded-2xl overflow-hidden flex flex-col",
                // Advanced liquid glass morphism
                isDark 
                  ? "backdrop-blur-[40px] bg-gradient-to-br from-white/8 via-white/4 to-white/2" 
                  : isExpanded
                    ? "backdrop-blur-[40px] bg-gradient-to-br from-white/5 via-white/3 to-white/2"
                    : "backdrop-blur-[60px] bg-gradient-to-br from-white/3 via-white/2 to-white/1",
                // Enhanced borders with gradient
                isDark
                  ? "border border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.6)]"
                  : isExpanded
                    ? "border border-white/15 shadow-[inset_0_2px_6px_rgba(255,255,255,0.4),0_12px_40px_rgba(0,0,0,0.08)]"
                    : "border border-white/10 shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_12px_40px_rgba(0,0,0,0.06)]",
                // Multi-layer glass effect
                "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none",
                isDark
                  ? "before:bg-gradient-to-br before:from-white/15 before:via-transparent before:to-white/5"
                  : isExpanded
                    ? "before:bg-gradient-to-br before:from-white/4 before:via-white/2 before:to-white/3"
                    : "before:bg-gradient-to-br before:from-white/2 before:via-white/1 before:to-white/2",
                // Inner glow effect
                "after:absolute after:inset-[1px] after:rounded-2xl after:pointer-events-none",
                isDark
                  ? "after:bg-gradient-to-t after:from-transparent after:via-white/3 after:to-white/8"
                  : isExpanded
                    ? "after:bg-gradient-to-t after:from-white/1 after:via-white/3 after:to-white/5"
                    : "after:bg-gradient-to-t after:from-white/0.5 after:via-white/2 after:to-white/3",
                "[&>*]:relative [&>*]:z-10",
                isExpanded
                  ? "inset-0 m-auto h-[85vh] w-[90%] max-w-5xl"
                  : "bottom-24 right-6 w-full max-w-[420px] h-[600px]"
              )}
            >
              {/* Header with Enhanced Glass Effect */}
              <div className={cn(
                "flex items-center justify-between p-4 rounded-t-2xl",
                // Enhanced glass header
                isDark 
                  ? "backdrop-blur-[20px] bg-gradient-to-r from-white/6 to-white/3 border-b border-white/15" 
                  : isExpanded
                    ? "backdrop-blur-[20px] bg-gradient-to-r from-white/4 to-white/2 border-b border-white/10"
                    : "backdrop-blur-[25px] bg-gradient-to-r from-white/2 to-white/1 border-b border-white/8",
                // Subtle inner highlight
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              )}>
                <div className="flex items-center gap-3">
                  <h3 className={cn(
                    "font-bold text-lg",
                    "drop-shadow-sm",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Camply AI
                  </h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className={cn(
                      "p-2 rounded-lg transition-colors backdrop-blur-md",
                      isDark ? "bg-white/3 border border-white/5" : "bg-white/5 border border-white/10",
                      isDark ? "hover:bg-white/6 hover:border-white/10 text-gray-300 hover:text-white" : "hover:bg-black/10 hover:border-black/20 text-gray-700 hover:text-gray-900"
                    )}
                    title="Reset conversation"
                  >
                    <IoRefresh className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleToggleExpand}
                    className={cn(
                      "p-2 rounded-lg transition-colors backdrop-blur-md",
                      isDark ? "bg-white/3 border border-white/5" : "bg-white/5 border border-white/10",
                      isDark ? "hover:bg-white/6 hover:border-white/10" : "hover:bg-white/10 hover:border-white/20",
                      isDark ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"
                    )}
                    title={isExpanded ? "Minimize" : "Expand"}
                  >
                    {isExpanded ? (
                      <IoContract className="w-4 h-4" />
                    ) : (
                      <IoExpand className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    className={cn(
                      "p-2 rounded-lg transition-colors backdrop-blur-md",
                      isDark ? "bg-white/3 border border-white/5" : "bg-white/5 border border-white/10",
                      "hover:bg-red-500/10 hover:border-red-500/20",
                      isDark ? "text-gray-300 hover:text-red-400" : "text-gray-700 hover:text-red-600"
                    )}
                    title="Close"
                  >
                    <IoClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages with Enhanced Glass Background */}
              <div className={cn(
                "flex-1 overflow-y-auto px-4 py-2 space-y-3 flex flex-col justify-end",
                // Enhanced messages area with glass effect
                isDark 
                  ? "backdrop-blur-[15px] bg-gradient-to-b from-white/2 to-white/1" 
                  : isExpanded
                    ? "backdrop-blur-[15px] bg-gradient-to-b from-white/2 to-white/1"
                    : "backdrop-blur-[20px] bg-gradient-to-b from-white/1 to-white/0.5",
                // Custom scrollbar
                isDark 
                  ? "scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent hover:scrollbar-thumb-white/25" 
                  : "scrollbar-thin scrollbar-thumb-gray-400/30 scrollbar-track-transparent hover:scrollbar-thumb-gray-500/45"
              )}>
                                  <div className="flex flex-col space-y-3 min-h-0">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "flex",
                            message.isUser ? "justify-end" : "justify-start"
                          )}
                        >
                      <div className={cn(
                        "rounded-2xl p-3 shadow-lg drop-shadow-sm",
                        // Dynamic width - remove max-width constraint for better responsiveness
                        message.isUser ? "ml-auto max-w-[85%]" : "mr-auto max-w-[90%]",
                        // Enhanced glass effect for messages - more visible and professional
                        message.isUser
                          ? isDark 
                            ? "backdrop-blur-[25px] bg-gradient-to-br from-white/20 to-white/12 border border-white/25 text-white shadow-[0_8px_32px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]" 
                            : isExpanded 
                              ? "backdrop-blur-[25px] bg-gradient-to-br from-white/35 to-white/25 border border-white/40 text-gray-900 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]"
                              : "backdrop-blur-[30px] bg-gradient-to-br from-white/50 to-white/40 border border-white/55 text-gray-900 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)]"
                          : isDark 
                            ? "backdrop-blur-[25px] bg-gradient-to-br from-white/12 to-white/6 border border-white/20 text-gray-100 shadow-[0_8px_32px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]" 
                            : isExpanded
                              ? "backdrop-blur-[25px] bg-gradient-to-br from-white/25 to-white/15 border border-white/30 text-gray-800 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.3)]"
                              : "backdrop-blur-[30px] bg-gradient-to-br from-white/40 to-white/30 border border-white/45 text-gray-800 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]",
                        message.loading && "animate-pulse"
                      )}>
                        {message.loading ? (
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className={cn("w-2 h-2 rounded-full animate-bounce", isDark ? "bg-gray-300" : "bg-gray-400")} />
                              <div className={cn("w-2 h-2 rounded-full animate-bounce", isDark ? "bg-gray-300" : "bg-gray-400")} style={{ animationDelay: '0.1s' }} />
                              <div className={cn("w-2 h-2 rounded-full animate-bounce", isDark ? "bg-gray-300" : "bg-gray-400")} style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span className="text-sm">Thinking...</span>
                          </div>
                        ) : (
                          <div className="text-sm sm:text-base leading-relaxed">
                            <MarkdownRenderer content={message.text} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                                    </AnimatePresence>
                  </div>
                  <div ref={messagesEndRef} />
                </div>

              {/* Input Section with Enhanced Glass Effect */}
              <div className={cn(
                "p-4 rounded-b-2xl",
                // Enhanced glass input section
                isDark 
                  ? "backdrop-blur-[20px] bg-gradient-to-r from-white/6 to-white/3 border-t border-white/15" 
                  : isExpanded
                    ? "backdrop-blur-[20px] bg-gradient-to-r from-white/4 to-white/2 border-t border-white/10"
                    : "backdrop-blur-[25px] bg-gradient-to-r from-white/2 to-white/1 border-t border-white/8",
                // Subtle inner highlight
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
              )}>
                                  <PlaceholdersAndVanishInput
                    placeholders={getPlaceholders()}
                    onChange={handleInputChange}
                    onSubmit={handleSubmit}
                    disabled={isLoading}
                    className={cn(
                      "w-full",
                      // Fix placeholder overflow in minimized dialog
                      !isExpanded && "[&_p]:max-w-[320px] [&_p]:truncate [&_p]:overflow-hidden"
                    )}
                    isDark={isDark}
                  />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CamplyBot; 