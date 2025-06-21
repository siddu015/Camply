import React from 'react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  Info, 
  Star, 
  Lightbulb, 
  CheckCircle, 
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
        1: 'text-xl md:text-2xl',
        2: 'text-lg md:text-xl', 
        3: 'text-base md:text-lg',
        4: 'text-sm md:text-base',
        5: 'text-sm',
        6: 'text-xs',
      };

      const validLevel = Math.min(Math.max(level, 1), 6);
      const HeadingComponent = validLevel === 1 ? 'h1' : 
                              validLevel === 2 ? 'h2' :
                              validLevel === 3 ? 'h3' :
                              validLevel === 4 ? 'h4' :
                              validLevel === 5 ? 'h5' : 'h6';

      return React.createElement(
        HeadingComponent,
        {
          key: currentIndex++,
          className: cn(
            sizes[validLevel as keyof typeof sizes] || sizes[6],
            validLevel <= 2 ? "font-bold mt-8 mb-4 pb-2 border-b" : "font-semibold mt-6 mb-3",
            isLight 
              ? "text-gray-900 border-gray-200" 
              : "text-gray-50 border-gray-800"
          )
        },
        text
      );
    };

    const renderList = (text: string, ordered: boolean = false) => {
      let content = text;
      
      if (ordered) {
        content = text.replace(/^\d+\.\s*/, '');
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

      content = text.replace(/^[-*+•]\s*/, '');

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
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      
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
        
        const italicParts = part.split(/(?<!\*)\*([^*]+)\*(?!\*)/g);
        if (italicParts.length > 1) {
          return italicParts.map((italicPart, italicIndex) => {
            if (italicIndex % 2 === 1) {
              return (
                <em key={`italic-${index}-${italicIndex}`} className="italic">
                  {italicPart}
                </em>
              );
            }
            
            return processCodeAndNumbers(italicPart, `${index}-${italicIndex}`);
          });
        }
        
        return processCodeAndNumbers(part, index.toString());
      });
    };

    const processCodeAndNumbers = (text: string, keyPrefix: string) => {
      const codeParts = text.split(/(`[^`]+`)/g);
      if (codeParts.length > 1) {
        return codeParts.map((codePart, codeIndex) => {
          if (codePart.startsWith('`') && codePart.endsWith('`')) {
            return (
              <code key={`code-${keyPrefix}-${codeIndex}`} className={cn(
                "px-1.5 py-0.5 rounded text-sm font-mono",
                isLight ? "bg-gray-100 text-gray-800" : "bg-gray-800 text-gray-200"
              )}>
                {codePart.slice(1, -1)}
              </code>
            );
          }
          
          return processNumbers(codePart, `${keyPrefix}-${codeIndex}`);
        });
      }
      
      return processNumbers(text, keyPrefix);
    };

    const processNumbers = (text: string, keyPrefix: string) => {               
      const numberRegex = /(\d+(?:,\d{3})*(?:\.\d+)?[%₹$]?|\d+\+?)/g;
      const textParts = text.split(numberRegex);
      
      return textParts.map((textPart, textIndex) => {
        if (numberRegex.test(textPart)) {
          return (
            <span key={`number-${keyPrefix}-${textIndex}`} className={cn(
              "font-semibold",
              isLight ? "text-primary" : "text-primary"
            )}>
              {textPart}
            </span>
          );
        }
        return textPart;
      });
    };

    const renderTable = (tableRows: string[]) => {
      const headerRow = tableRows[0].trim().split('|').filter(cell => cell.trim() !== '');
      const bodyRows = tableRows.slice(2);
      
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

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        i++;
        continue;
      }

      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        const tableRows = [];
        let j = i;

        while (j < lines.length && lines[j].trim().startsWith('|')) {
          tableRows.push(lines[j]);
          j++;
        }
        
        if (tableRows.length >= 3) {
          elements.push(renderTable(tableRows));
          i = j;
          continue;
        }
      }

      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        elements.push(renderHeading(text, level));
        i++;
        continue;
      }

      if (trimmedLine.match(/^[A-Z][A-Z\s&-]+:?$/)) {
        elements.push(renderHeading(trimmedLine.replace(/:$/, ''), 1));
        i++;
        continue;
      }

      if (trimmedLine.match(/^[A-Z][a-zA-Z\s&-]+:$/)) {
        elements.push(renderHeading(trimmedLine.replace(/:$/, ''), 2));
        i++;
        continue;
      }

      if (trimmedLine.match(/^[-*+]\s+/)) {
        elements.push(renderList(trimmedLine));
        i++;
        continue;
      }

      if (trimmedLine.startsWith('•')) {
        elements.push(renderList(trimmedLine));
        i++;
        continue;
      }

      if (trimmedLine.match(/^\d+\.\s/)) {
        elements.push(renderList(trimmedLine, true));
        i++;
        continue;
      }

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
