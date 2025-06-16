import React from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/components/sidebar/lib/utils';
import { Bot, AlertCircle, Info } from 'lucide-react';

interface CampusMarkdownRendererProps {
  content: string;
  className?: string;
}

export const CampusMarkdownRenderer: React.FC<CampusMarkdownRendererProps> = ({ content, className }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    const renderHeading = (text: string, level: number) => {
      const sizes = {
        1: 'text-2xl md:text-3xl',
        2: 'text-xl md:text-2xl',
        3: 'text-lg md:text-xl',
      };

      return (
        <h1 
          key={currentIndex++} 
          className={cn(
            sizes[level as keyof typeof sizes],
            "font-bold mt-8 mb-4 pb-3 border-b flex items-center gap-3",
            isLight 
              ? "text-gray-900 border-gray-200" 
              : "text-gray-50 border-gray-800",
            "group"
          )}
        >
          <span className={cn(
            "w-1.5 h-1.5 rounded-full group-hover:scale-150 transition-transform",
            isLight ? "bg-primary" : "bg-primary"
          )} />
          {text}
        </h1>
      );
    };

    const renderList = (text: string, ordered: boolean = false) => {
      const content = text.replace(/^[•\-*\d+\.]\s*/, '');
      
      if (ordered) {
        const number = text.match(/^(\d+)\./)?.[1];
        return (
          <div key={currentIndex++} className="flex items-start gap-3 mb-3 ml-4">
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5",
              isLight 
                ? "bg-primary/10 text-primary" 
                : "bg-primary/20 text-primary-foreground"
            )}>
              {number}
            </span>
            <p className={cn(
              "text-base leading-relaxed",
              isLight ? "text-gray-700" : "text-gray-300"
            )}>
              {content}
            </p>
          </div>
        );
      }

      return (
        <div key={currentIndex++} className="flex items-start gap-3 mb-3 ml-4 group">
          <span className={cn(
            "w-2 h-2 rounded-full mt-2 flex-shrink-0 group-hover:scale-150 transition-transform",
            isLight ? "bg-primary" : "bg-primary"
          )} />
          <p className={cn(
            "text-base leading-relaxed",
            isLight ? "text-gray-700" : "text-gray-300"
          )}>
            {content}
          </p>
        </div>
      );
    };

    const renderCallout = (text: string, type: 'info' | 'warning' | 'success' = 'info') => {
      const styles = {
        info: {
          bg: isLight ? 'bg-blue-50' : 'bg-blue-950/20',
          border: isLight ? 'border-blue-200' : 'border-blue-800',
          icon: Info,
          iconColor: isLight ? 'text-blue-600' : 'text-blue-400',
          textColor: isLight ? 'text-blue-900' : 'text-blue-100',
        },
        warning: {
          bg: isLight ? 'bg-yellow-50' : 'bg-yellow-950/20',
          border: isLight ? 'border-yellow-200' : 'border-yellow-800',
          icon: AlertCircle,
          iconColor: isLight ? 'text-yellow-600' : 'text-yellow-400',
          textColor: isLight ? 'text-yellow-900' : 'text-yellow-100',
        },
        success: {
          bg: isLight ? 'bg-green-50' : 'bg-green-950/20',
          border: isLight ? 'border-green-200' : 'border-green-800',
          icon: Bot,
          iconColor: isLight ? 'text-green-600' : 'text-green-400',
          textColor: isLight ? 'text-green-900' : 'text-green-100',
        },
      };

      const style = styles[type];
      const Icon = style.icon;

      return (
        <div key={currentIndex++} className={cn(
          "my-6 p-4 rounded-lg border",
          style.bg,
          style.border
        )}>
          <div className="flex items-start space-x-3">
            <Icon className={cn("h-5 w-5 mt-0.5", style.iconColor)} />
            <div>
              <p className={cn(
                "text-sm leading-relaxed",
                style.textColor
              )}>
                {text}
              </p>
            </div>
          </div>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) continue;

      // Headings
      if (trimmedLine.match(/^[A-Z][A-Z\s&-]+:?$/)) {
        elements.push(renderHeading(trimmedLine.replace(/:$/, ''), 1));
        continue;
      }

      // Subheadings
      if (trimmedLine.match(/^[A-Z][a-zA-Z\s&-]+:$/)) {
        elements.push(renderHeading(trimmedLine.replace(/:$/, ''), 2));
        continue;
      }

      // Lists
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        elements.push(renderList(trimmedLine));
        continue;
      }

      // Numbered lists
      if (trimmedLine.match(/^\d+\.\s/)) {
        elements.push(renderList(trimmedLine, true));
        continue;
      }

      // Callouts
      if (trimmedLine.includes('NOTE:') || trimmedLine.includes('IMPORTANT:')) {
        elements.push(renderCallout(trimmedLine.replace(/^(NOTE|IMPORTANT):\s*/, ''), 'info'));
        continue;
      }

      if (trimmedLine.includes('WARNING:') || trimmedLine.includes('CAUTION:')) {
        elements.push(renderCallout(trimmedLine.replace(/^(WARNING|CAUTION):\s*/, ''), 'warning'));
        continue;
      }

      if (trimmedLine.includes('SUCCESS:') || trimmedLine.includes('TIP:')) {
        elements.push(renderCallout(trimmedLine.replace(/^(SUCCESS|TIP):\s*/, ''), 'success'));
        continue;
      }

      // Regular paragraphs
      elements.push(
        <p key={currentIndex++} className={cn(
          "text-base leading-relaxed mb-4",
          isLight ? "text-gray-700" : "text-gray-300"
        )}>
          {trimmedLine}
        </p>
      );
    }

    return elements;
  };

  return (
    <div className={cn(
      "prose prose-lg max-w-none",
      "prose-headings:font-bold prose-headings:text-foreground",
      "prose-p:text-foreground/90 prose-p:leading-7",
      "prose-strong:text-foreground prose-strong:font-semibold",
      "prose-a:text-primary hover:prose-a:text-primary/80",
      "prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1",
      className
    )}>
      {parseContent(content)}
    </div>
  );
}; 