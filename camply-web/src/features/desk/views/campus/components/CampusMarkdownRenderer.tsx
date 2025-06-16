import React from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/components/sidebar/lib/utils';
import { 
  Bot, 
  AlertCircle, 
  Info, 
  Star, 
  Lightbulb, 
  CheckCircle, 
  BookOpen, 
  MapPin, 
  Calendar,
  TrendingUp,
  Building,
  Trophy,
  GraduationCap,
  Users
} from 'lucide-react';

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
        1: 'text-3xl md:text-4xl',
        2: 'text-2xl md:text-3xl',
        3: 'text-xl md:text-2xl',
      };

      const icons = {
        OVERVIEW: BookOpen,
        PLACEMENTS: TrendingUp,
        FACILITIES: Building,
        ACHIEVEMENTS: Trophy,
        EVENTS: Calendar,
        CAMPUS: MapPin,
        ACADEMICS: GraduationCap,
        ADMISSIONS: Users,
      };

      // Find matching icon based on text content
      const iconKey = Object.keys(icons).find(key => text.toUpperCase().includes(key));
      const IconComponent = iconKey ? icons[iconKey as keyof typeof icons] : null;

      return (
        <h1 
          key={currentIndex++} 
          className={cn(
            sizes[level as keyof typeof sizes],
            "font-bold mt-12 mb-6 pb-4 border-b flex items-center gap-3",
            isLight 
              ? "text-gray-900 border-gray-200" 
              : "text-gray-50 border-gray-800",
            "group"
          )}
        >
          {IconComponent ? (
            <IconComponent className={cn(
              "h-6 w-6 text-primary group-hover:scale-125 transition-transform",
            )} />
          ) : (
            <span className={cn(
              "w-2 h-2 rounded-full group-hover:scale-150 transition-transform",
              "bg-primary"
            )} />
          )}
          {text}
        </h1>
      );
    };

    const renderList = (text: string, ordered: boolean = false) => {
      const content = text.replace(/^[•\-*\d+\.]\s*/, '');
      
      if (ordered) {
        const number = text.match(/^(\d+)\./)?.[1];
        return (
          <div key={currentIndex++} className="flex items-start gap-4 mb-4 ml-6 group">
            <span className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5",
              isLight 
                ? "bg-primary/10 text-primary" 
                : "bg-primary/20 text-primary-foreground"
            )}>
              {number}
            </span>
            <p className={cn(
              "text-lg leading-relaxed",
              isLight ? "text-gray-700" : "text-gray-300"
            )}>
              {processInlineFormatting(content)}
            </p>
          </div>
        );
      }

      return (
        <div key={currentIndex++} className="flex items-start gap-4 mb-4 ml-6 group">
          <CheckCircle className={cn(
            "h-5 w-5 flex-shrink-0 mt-1 group-hover:text-primary transition-colors",
            isLight ? "text-primary/70" : "text-primary/70"
          )} />
          <p className={cn(
            "text-lg leading-relaxed",
            isLight ? "text-gray-700" : "text-gray-300"
          )}>
            {processInlineFormatting(content)}
          </p>
        </div>
      );
    };

    const renderCallout = (text: string, type: 'info' | 'warning' | 'success' | 'tip' = 'info') => {
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
          icon: Star,
          iconColor: isLight ? 'text-green-600' : 'text-green-400',
          textColor: isLight ? 'text-green-900' : 'text-green-100',
        },
        tip: {
          bg: isLight ? 'bg-purple-50' : 'bg-purple-950/20',
          border: isLight ? 'border-purple-200' : 'border-purple-800',
          icon: Lightbulb,
          iconColor: isLight ? 'text-purple-600' : 'text-purple-400',
          textColor: isLight ? 'text-purple-900' : 'text-purple-100',
        },
      };

      const style = styles[type];
      const Icon = style.icon;

      return (
        <div key={currentIndex++} className={cn(
          "my-8 p-6 rounded-xl border",
          style.bg,
          style.border
        )}>
          <div className="flex items-start space-x-4">
            <Icon className={cn("h-6 w-6 mt-1", style.iconColor)} />
            <div>
              <p className={cn(
                "text-lg leading-relaxed",
                style.textColor
              )}>
                {processInlineFormatting(text)}
              </p>
            </div>
          </div>
        </div>
      );
    };

    const processInlineFormatting = (text: string) => {
      // Process bold text (**text**)
      let parts = text.split(/(\*\*[^*]+\*\*)/g);
      
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={`bold-${index}`} className={cn(
              "font-semibold",
              isLight ? "text-gray-900" : "text-gray-100"
            )}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        
        // Process italic text (*text*)
        const italicParts = part.split(/(\*[^*]+\*)/g);
        if (italicParts.length > 1) {
          return italicParts.map((italicPart, italicIndex) => {
            if (italicPart.startsWith('*') && italicPart.endsWith('*') && !italicPart.startsWith('**')) {
              return (
                <em key={`italic-${index}-${italicIndex}`} className="italic">
                  {italicPart.slice(1, -1)}
                </em>
              );
            }
            
            // Process numbers and percentages
            const numberRegex = /(\d+(?:,\d{3})*(?:\.\d+)?%?|\d+\+?)/g;
            const textParts = italicPart.split(numberRegex);
            
            return textParts.map((textPart, textIndex) => {
              if (numberRegex.test(textPart)) {
                return (
                  <span key={`number-${index}-${italicIndex}-${textIndex}`} className={cn(
                    "font-semibold",
                    isLight ? "text-primary" : "text-primary"
                  )}>
                    {textPart}
                  </span>
                );
              }
              return textPart;
            });
          });
        }
        
        // Process numbers and percentages for parts without italic
        const numberRegex = /(\d+(?:,\d{3})*(?:\.\d+)?%?|\d+\+?)/g;
        const textParts = part.split(numberRegex);
        
        return textParts.map((textPart, textIndex) => {
          if (numberRegex.test(textPart)) {
            return (
              <span key={`number-${index}-${textIndex}`} className={cn(
                "font-semibold",
                isLight ? "text-primary" : "text-primary"
              )}>
                {textPart}
              </span>
            );
          }
          return textPart;
        });
      });
    };

    // Detect tables and render them
    const renderTable = (tableRows: string[]) => {
      const headerRow = tableRows[0].trim().split('|').filter(cell => cell.trim() !== '');
      const bodyRows = tableRows.slice(2); // Skip the separator row
      
      return (
        <div key={currentIndex++} className="my-8 overflow-x-auto">
          <table className={cn(
            "w-full border-collapse",
            isLight ? "text-gray-700" : "text-gray-300"
          )}>
            <thead>
              <tr className={cn(
                "border-b",
                isLight ? "border-gray-300" : "border-gray-700"
              )}>
                {headerRow.map((cell, i) => (
                  <th key={i} className="py-3 px-4 text-left font-semibold">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, i) => {
                const cells = row.trim().split('|').filter(cell => cell.trim() !== '');
                return (
                  <tr key={i} className={cn(
                    "border-b",
                    isLight ? "border-gray-200" : "border-gray-800"
                  )}>
                    {cells.map((cell, j) => (
                      <td key={j} className="py-3 px-4">
                        {processInlineFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };

    // Process the content line by line
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        i++;
        continue;
      }

      // Detect tables
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        const tableRows = [];
        let j = i;
        
        // Collect all table rows
        while (j < lines.length && lines[j].trim().startsWith('|')) {
          tableRows.push(lines[j]);
          j++;
        }
        
        if (tableRows.length >= 3) { // Valid table needs header, separator and at least one row
          elements.push(renderTable(tableRows));
          i = j;
          continue;
        }
      }

      // Headings
      if (trimmedLine.match(/^[A-Z][A-Z\s&-]+:?$/)) {
        elements.push(renderHeading(trimmedLine.replace(/:$/, ''), 1));
        i++;
        continue;
      }

      // Subheadings
      if (trimmedLine.match(/^[A-Z][a-zA-Z\s&-]+:$/)) {
        elements.push(renderHeading(trimmedLine.replace(/:$/, ''), 2));
        i++;
        continue;
      }

      // Lists
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        elements.push(renderList(trimmedLine));
        i++;
        continue;
      }

      // Numbered lists
      if (trimmedLine.match(/^\d+\.\s/)) {
        elements.push(renderList(trimmedLine, true));
        i++;
        continue;
      }

      // Callouts
      if (trimmedLine.includes('NOTE:') || trimmedLine.includes('IMPORTANT:')) {
        elements.push(renderCallout(trimmedLine.replace(/^(NOTE|IMPORTANT):\s*/, ''), 'info'));
        i++;
        continue;
      }

      if (trimmedLine.includes('WARNING:') || trimmedLine.includes('CAUTION:')) {
        elements.push(renderCallout(trimmedLine.replace(/^(WARNING|CAUTION):\s*/, ''), 'warning'));
        i++;
        continue;
      }

      if (trimmedLine.includes('SUCCESS:') || trimmedLine.includes('ACHIEVEMENT:')) {
        elements.push(renderCallout(trimmedLine.replace(/^(SUCCESS|ACHIEVEMENT):\s*/, ''), 'success'));
        i++;
        continue;
      }

      if (trimmedLine.includes('TIP:') || trimmedLine.includes('HINT:')) {
        elements.push(renderCallout(trimmedLine.replace(/^(TIP|HINT):\s*/, ''), 'tip'));
        i++;
        continue;
      }

      // Horizontal rule
      if (trimmedLine.match(/^---+$/) || trimmedLine.match(/^===+$/)) {
        elements.push(
          <hr key={currentIndex++} className={cn(
            "my-8 border-t",
            isLight ? "border-gray-200" : "border-gray-800"
          )} />
        );
        i++;
        continue;
      }

      // Regular paragraphs
      elements.push(
        <p key={currentIndex++} className={cn(
          "text-lg leading-relaxed mb-6",
          isLight ? "text-gray-700" : "text-gray-300"
        )}>
          {processInlineFormatting(trimmedLine)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return (
    <div className={cn(
      "prose prose-lg max-w-none",
      "prose-headings:font-bold prose-headings:text-foreground",
      "prose-p:text-foreground/90 prose-p:leading-8",
      "prose-strong:text-foreground prose-strong:font-semibold",
      "prose-a:text-primary hover:prose-a:text-primary/80",
      "prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1",
      "prose-hr:border-border",
      "prose-table:border-border",
      className
    )}>
      {parseContent(content)}
    </div>
  );
}; 