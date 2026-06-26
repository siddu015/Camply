import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { Course, UpdateCourseData } from '../types';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: UpdateCourseData) => Promise<{ data: any; error: string | null }>;
  course: Course;
  loading?: boolean;
}

export const EditCourseModal = ({ isOpen, onClose, onSubmit, course, loading = false }: EditCourseModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [formData, setFormData] = useState<UpdateCourseData>({
    course_name: course.course_name,
    course_code: course.course_code || '',
    credits: course.credits || undefined,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.course_name?.trim()) {
      newErrors.course_name = 'Course name is required';
    } else if (formData.course_name.trim().length < 2) {
      newErrors.course_name = 'Course name must be at least 2 characters';
    }

    if (formData.credits !== undefined && formData.credits !== null) {
      if (formData.credits < 0 || formData.credits > 10) {
        newErrors.credits = 'Credits must be between 0 and 10';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await onSubmit({
        course_name: formData.course_name?.trim(),
        course_code: formData.course_code?.trim() || undefined,
        credits: formData.credits || undefined,
      });
      
      if (!error) {
        onClose();
      } else {
        setErrors({ submit: error });
      }
    } catch (err) {
      setErrors({ submit: 'Failed to update course. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setErrors({});
    onClose();
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>        
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
            className={cn(
              "fixed inset-0 z-40 backdrop-blur-[3px]",
              isDark ? "bg-black/40" : "bg-gray-500/50"
            )}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden"
            >
              <div 
                className={cn(
                  "rounded-2xl overflow-hidden flex flex-col relative",
                  isDark 
                    ? "backdrop-blur-[40px] bg-gradient-to-br from-white/12 via-white/6 to-white/3" 
                    : "backdrop-blur-[60px] bg-gradient-to-br from-white/8 via-white/4 to-white/2",
                  isDark
                    ? "border border-white/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.6)]"
                    : "border border-white/20 shadow-[inset_0_2px_6px_rgba(255,255,255,0.5),0_12px_40px_rgba(0,0,0,0.15)]",
                  "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none",
                  isDark
                    ? "before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-white/8"
                    : "before:bg-gradient-to-br before:from-white/12 before:via-white/4 before:to-white/6",
                  "after:absolute after:inset-[1px] after:rounded-2xl after:pointer-events-none",
                  isDark
                    ? "after:bg-gradient-to-t after:from-transparent after:via-white/4 after:to-white/12"
                    : "after:bg-gradient-to-t after:from-white/2 after:via-white/5 after:to-white/8",
                  "[&>*]:relative [&>*]:z-10"
                )}
              >
                <div className={cn(
                  "flex items-center justify-between p-6 rounded-t-2xl",
                  isDark 
                    ? "backdrop-blur-[25px] bg-gradient-to-r from-white/8 to-white/4 border-b border-white/20" 
                    : "backdrop-blur-[30px] bg-gradient-to-r from-white/12 to-white/6 border-b border-white/25",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                )}>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground drop-shadow-lg">
                      Edit Course
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className={cn(
                      "p-2 rounded-lg transition-colors backdrop-blur-md",
                      isDark ? "bg-white/5 border border-white/8" : "bg-white/12 border border-white/20",
                      "hover:bg-destructive/10 hover:border-destructive/20",
                      "text-muted-foreground hover:text-destructive",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className={cn(
                  "p-6",
                  isDark 
                    ? "backdrop-blur-[20px] bg-gradient-to-b from-white/3 to-white/1" 
                    : "backdrop-blur-[25px] bg-gradient-to-b from-white/6 to-white/3"
                )}>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className={cn(
                        "text-sm font-medium flex items-center gap-2 drop-shadow-sm",
                        "text-foreground"
                      )}>
                        Course Name *
                      </label>
                      <input
                        type="text"
                        value={formData.course_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, course_name: e.target.value }))}
                        placeholder="Data Structures & Algorithms"
                        disabled={isSubmitting}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border transition-all duration-200 backdrop-blur-md text-base",
                          isDark 
                            ? "bg-white/8 border-white/20 text-white placeholder:text-white/60" 
                            : "bg-white/20 border-white/30 text-foreground placeholder:text-muted-foreground",
                          "focus:outline-none focus:ring-2 focus:border-transparent focus:scale-[1.02]",
                          isDark 
                            ? "focus:ring-accent/50 focus:bg-white/12" 
                            : "focus:ring-accent/50 focus:bg-white/30",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          errors.course_name && (isDark 
                            ? "border-destructive/50 focus:ring-destructive/50" 
                            : "border-destructive/50 focus:ring-destructive/50")
                        )}
                      />
                      {errors.course_name && (
                        <p className="text-sm text-destructive drop-shadow-sm">
                          {errors.course_name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className={cn(
                        "text-sm font-medium flex items-center gap-2 drop-shadow-sm",
                        "text-muted-foreground"
                      )}>
                        Course Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.course_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value }))}
                        placeholder="CS101"
                        disabled={isSubmitting}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border transition-all duration-200 backdrop-blur-md text-base",
                          isDark 
                            ? "bg-white/8 border-white/20 text-white placeholder:text-white/60" 
                            : "bg-white/20 border-white/30 text-foreground placeholder:text-muted-foreground",
                          "focus:outline-none focus:ring-2 focus:border-transparent focus:scale-[1.02]",
                          isDark 
                            ? "focus:ring-accent/50 focus:bg-white/12" 
                            : "focus:ring-accent/50 focus:bg-white/30",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={cn(
                        "text-sm font-medium flex items-center gap-2 drop-shadow-sm",
                        "text-muted-foreground"
                      )}>
                        Credits (Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.credits || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          credits: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                        placeholder="3"
                        disabled={isSubmitting}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border transition-all duration-200 backdrop-blur-md text-base",
                          isDark 
                            ? "bg-white/8 border-white/20 text-white placeholder:text-white/60" 
                            : "bg-white/20 border-white/30 text-foreground placeholder:text-muted-foreground",
                          "focus:outline-none focus:ring-2 focus:border-transparent focus:scale-[1.02]",
                          isDark 
                            ? "focus:ring-accent/50 focus:bg-white/12" 
                            : "focus:ring-accent/50 focus:bg-white/30",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          errors.credits && (isDark 
                            ? "border-destructive/50 focus:ring-destructive/50" 
                            : "border-destructive/50 focus:ring-destructive/50")
                        )}
                      />
                      {errors.credits && (
                        <p className={cn(
                          "text-sm drop-shadow-sm",
                          isDark ? "text-red-400" : "text-red-600"
                        )}>
                          {errors.credits}
                        </p>
                      )}
                    </div>

                    {errors.submit && (
                      <div className="p-3 rounded-xl backdrop-blur-md border bg-destructive/10 border-destructive/30">
                        <p className="text-sm text-destructive drop-shadow-sm">
                          {errors.submit}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className={cn(
                          "flex items-center gap-2 rounded-xl transition-all duration-300 font-medium px-6 py-3 text-base",
                          "backdrop-blur-md border shadow-lg",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          isSubmitting
                            ? "bg-white/5 border-white/10 text-white/50"
                            : isDark
                              ? "bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30 hover:scale-105"
                              : "bg-white/15 border-white/25 text-foreground hover:bg-white/20 hover:border-white/35 hover:scale-105"
                        )}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.course_name?.trim()}
                        className={cn(
                          "flex items-center gap-2 rounded-xl transition-all duration-300 font-medium px-6 py-3 text-base",
                          "backdrop-blur-md border shadow-lg hover:scale-105",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "bg-accent hover:bg-accent/80 border-accent/30 text-accent-foreground font-semibold"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Update Course</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}; 