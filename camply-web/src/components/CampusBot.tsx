import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoRefresh } from 'react-icons/io5';
import { FaMicrophone } from 'react-icons/fa';
import { RiRobot2Fill } from 'react-icons/ri';
import { IoMdSend } from 'react-icons/io';
import { MdOpenInFull } from 'react-icons/md';
import { useTheme } from '../lib/theme-provider';
import { cn } from '../features/sidebar/lib/utils';

// Quick reply questions
const QUICK_QUESTIONS = [
  "What is my Campus great for?",
  "What are the placements?",
  "What courses are offered?",
  "Is hostel accommodation available?",
  "How many students study here?"
];

interface Message {
  text: string;
  isUser: boolean;
}

export const CampusBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isWideView, setIsWideView] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset conversation
  const handleReset = () => {
    setMessages([]);
  };

  // Handle message submission
  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { text, isUser: true }]);
    setInputText('');
    
    // Placeholder for backend integration
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "I understand your question. This is a placeholder response as we're currently in UI-only mode.",
        isUser: false
      }]);
    }, 1000);
  };

  // Toggle wide view
  const handleWideViewToggle = () => {
    setIsWideView(!isWideView);
  };

  // Close both views
  const handleClose = () => {
    setIsOpen(false);
    setIsWideView(false);
  };

  return (
    <>
      {/* Bot Icon */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-lg z-50",
          "bg-gradient-to-br from-blue-500 to-purple-600",
          "hover:shadow-xl transition-all duration-300 hover:scale-110",
          "flex items-center justify-center"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <RiRobot2Fill className="w-6 h-6 text-white" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for wide view */}
            {isWideView && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={handleClose}
              />
            )}

            {/* Chat Window Container */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "fixed z-50 rounded-3xl shadow-xl",
                "backdrop-blur-xl border",
                isWideView
                  ? "inset-0 m-auto h-[80vh] w-[90%] max-w-4xl"
                  : "bottom-24 right-6 w-full max-w-[400px]",
                isLight
                  ? "bg-white/90 border-gray-200"
                  : "bg-gray-900/90 border-gray-700"
              )}
            >
              {/* Header */}
              <div className={cn(
                "flex items-center justify-between p-4 border-b",
                isLight ? "border-gray-200" : "border-gray-700"
              )}>
                <div className="flex items-center gap-2">
                  <RiRobot2Fill className={cn(
                    "w-6 h-6",
                    isLight ? "text-blue-600" : "text-blue-400"
                  )} />
                  <h3 className={cn(
                    "font-semibold",
                    isLight ? "text-gray-800" : "text-gray-100"
                  )}>
                    CampusBot
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isLight
                        ? "hover:bg-gray-100 text-gray-600"
                        : "hover:bg-gray-800 text-gray-300"
                    )}
                  >
                    <IoRefresh className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleWideViewToggle}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isLight
                        ? "hover:bg-gray-100 text-gray-600"
                        : "hover:bg-gray-800 text-gray-300"
                    )}
                  >
                    <MdOpenInFull className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleClose}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isLight
                        ? "hover:bg-gray-100 text-gray-600"
                        : "hover:bg-gray-800 text-gray-300"
                    )}
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                className={cn(
                  "overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden",
                  isWideView ? "h-[calc(80vh-130px)]" : "h-[350px]",
                  isLight ? "text-gray-800" : "text-gray-200"
                )}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col gap-4">
                    <p className={cn(
                      "text-sm",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      Hi! I'm CampusBot. Ask me anything about our campus or click one of the suggestions below.
                    </p>
                    <div className={cn(
                      "flex gap-2",
                      isWideView ? "flex-col" : "flex-wrap"
                    )}>
                      {QUICK_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSubmit(q)}
                          className={cn(
                            "px-4 py-3 text-sm rounded-xl transition-colors text-left",
                            "border",
                            isWideView ? "w-full" : "whitespace-nowrap",
                            isLight
                              ? "border-gray-200 hover:bg-gray-100"
                              : "border-gray-700 hover:bg-gray-800"
                          )}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex",
                        msg.isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2",
                          msg.isUser
                            ? isLight
                              ? "bg-blue-500 text-white"
                              : "bg-blue-600 text-white"
                            : isLight
                            ? "bg-gray-100"
                            : "bg-gray-800"
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className={cn(
                "absolute bottom-0 left-0 right-0 p-4 border-t bg-inherit rounded-b-3xl",
                isLight ? "border-gray-200" : "border-gray-700"
              )}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(inputText);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your question..."
                    className={cn(
                      "flex-1 p-2 rounded-xl",
                      "focus:outline-none focus:ring-2",
                      isLight
                        ? "bg-gray-100 focus:ring-blue-200"
                        : "bg-gray-800 focus:ring-blue-500/50"
                    )}
                  />
                  <button
                    type="button"
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isLight
                        ? "hover:bg-gray-100 text-gray-600"
                        : "hover:bg-gray-800 text-gray-300"
                    )}
                  >
                    <FaMicrophone className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isLight
                        ? "hover:bg-gray-100 text-blue-600"
                        : "hover:bg-gray-800 text-blue-400"
                    )}
                  >
                    <IoMdSend className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}; 