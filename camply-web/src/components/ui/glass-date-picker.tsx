import React, { useState, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface GlassDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const GlassDatePicker = forwardRef<HTMLDivElement, GlassDatePickerProps>(({
  value,
  onChange,
  placeholder = "Select date",
  error,
  disabled = false,
  min,
  max,
  className,
  label,
  required = false
}, ref) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });

  const selectedDate = value ? new Date(value) : null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoString = `${year}-${month}-${day}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setViewMode('days');
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setViewMode('months');
  };

  const navigateMonth = (direction: 1 | -1) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label className={cn(
          "block text-sm font-medium mb-2",
          isDark ? "text-white/90" : "text-muted-foreground"
        )}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          "shadow-lg flex items-center justify-between",
          disabled && "opacity-50 cursor-not-allowed",
          error
            ? isDark
              ? "backdrop-blur-lg bg-white/8 border border-red-400/60 focus:border-red-400 focus:ring-red-400/30"
              : "backdrop-blur-lg bg-black/5 border border-red-500/60 focus:border-red-500 focus:ring-red-500/30"
            : isDark
              ? "backdrop-blur-lg bg-white/8 border border-white/25 focus:border-white/40 focus:ring-white/20 hover:bg-white/10"
              : "backdrop-blur-lg bg-black/5 border border-black/10 focus:border-black/20 focus:ring-black/10 hover:bg-black/10"
        )}
      >
        <div className="flex items-center gap-3">
          <Calendar className={cn(
            "w-5 h-5",
            isDark ? "text-white/70" : "text-gray-600"
          )} />
          <span className={cn(
            selectedDate ? "text-current" : "opacity-50",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 transition-transform duration-200",
          isOpen && "rotate-180",
          isDark ? "text-white/70" : "text-gray-600"
        )} />
      </div>

      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500 font-medium mt-2"
        >
          {error}
        </motion.p>
      )}

      {isOpen && createPortal(
        <AnimatePresence>
          <div>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]",
                "w-80 max-w-[90vw] rounded-2xl overflow-hidden shadow-2xl",
                isDark 
                  ? "backdrop-blur-[40px] bg-gradient-to-br from-white/15 via-white/8 to-white/5" 
                  : "backdrop-blur-[60px] bg-gradient-to-br from-white/95 via-white/85 to-white/75",
                isDark
                  ? "border border-white/30"
                  : "border border-white/50"
              )}
              onClick={(e) => e.stopPropagation()}
            >
            <div className={cn(
              "px-3 py-2 flex items-center justify-between",
              isDark 
                ? "backdrop-blur-[25px] bg-white/10 border-b border-white/20" 
                : "backdrop-blur-[30px] bg-white/20 border-b border-white/30"
            )}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (viewMode === 'days') navigateMonth(-1);
                }}
                disabled={viewMode !== 'days'}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  viewMode === 'days'
                    ? isDark 
                      ? "hover:bg-white/10 text-white" 
                      : "hover:bg-black/10 text-gray-900"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode(viewMode === 'months' ? 'days' : 'months');
                  }}
                  className={cn(
                    "px-2 py-1 rounded-md transition-colors font-medium text-sm",
                    isDark 
                      ? "hover:bg-white/10 text-white" 
                      : "hover:bg-black/10 text-gray-900"
                  )}
                >
                  {MONTHS[currentDate.getMonth()]}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode(viewMode === 'years' ? 'months' : 'years');
                  }}
                  className={cn(
                    "px-2 py-1 rounded-md transition-colors font-medium text-sm",
                    isDark 
                      ? "hover:bg-white/10 text-white" 
                      : "hover:bg-black/10 text-gray-900"
                  )}
                >
                  {currentDate.getFullYear()}
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (viewMode === 'days') navigateMonth(1);
                }}
                disabled={viewMode !== 'days'}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  viewMode === 'days'
                    ? isDark 
                      ? "hover:bg-white/10 text-white" 
                      : "hover:bg-black/10 text-gray-900"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3">
              {viewMode === 'days' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAYS.map(day => (
                      <div
                        key={day}
                        className={cn(
                          "text-center text-xs font-medium py-1",
                          isDark ? "text-white/60" : "text-gray-500"
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                                
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth().map(({ date, isCurrentMonth }, index) => {
                      const disabled = isDateDisabled(date);
                      const selected = isDateSelected(date);
                      const today = isToday(date);
                      
                      return (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled && isCurrentMonth) {
                              handleDateSelect(date);
                            }
                          }}
                          disabled={disabled || !isCurrentMonth}
                          className={cn(
                            "w-7 h-7 text-xs rounded-md transition-all duration-200",
                            "flex items-center justify-center",
                            !isCurrentMonth && "opacity-30",
                            disabled && "opacity-30 cursor-not-allowed",
                            selected && isDark
                              ? "bg-white/20 text-white ring-2 ring-white/40"
                              : selected
                                ? "bg-black/20 text-gray-900 ring-2 ring-black/40"
                                : today && isDark
                                  ? "bg-blue-500/30 text-blue-300"
                                  : today
                                    ? "bg-blue-500/20 text-blue-700"
                                    : isDark
                                      ? "hover:bg-white/10 text-white/80"
                                      : "hover:bg-black/10 text-gray-700"
                          )}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === 'months' && (
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((month, index) => (
                    <button
                      key={month}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMonthSelect(index);
                      }}
                      className={cn(
                        "px-2 py-1.5 text-xs rounded-md transition-colors",
                        currentDate.getMonth() === index
                          ? isDark
                            ? "bg-white/20 text-white"
                            : "bg-black/20 text-gray-900"
                          : isDark
                            ? "hover:bg-white/10 text-white/80"
                            : "hover:bg-black/10 text-gray-700"
                      )}
                    >
                      {month.slice(0, 3)}
                    </button>
                  ))}
                </div>
              )}

              {viewMode === 'years' && (
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleYearSelect(year);
                      }}
                      className={cn(
                        "px-2 py-1.5 text-xs rounded-md transition-colors",
                        currentDate.getFullYear() === year
                          ? isDark
                            ? "bg-white/20 text-white"
                            : "bg-black/20 text-gray-900"
                          : isDark
                            ? "hover:bg-white/10 text-white/80"
                            : "hover:bg-black/10 text-gray-700"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});

GlassDatePicker.displayName = 'GlassDatePicker'; 