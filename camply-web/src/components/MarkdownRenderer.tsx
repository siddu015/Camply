import React from 'react';
import { useTheme } from '../lib/theme-provider';
import { cn } from './sidebar/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        continue;
      }

      // Main headers (with === separators)
      if (trimmedLine.includes('===') && trimmedLine.length > 10) {
        elements.push(
          <div key={currentIndex++} className="my-4">
            <div className={cn(
              "w-full h-px mb-2",
              isLight ? "bg-gradient-to-r from-blue-200 to-purple-200" : "bg-gradient-to-r from-blue-600 to-purple-600"
            )} />
          </div>
        );
        continue;
      }

      // Section headers (ALL CAPS or title case with specific patterns)
      if (
        (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && !trimmedLine.includes('•')) ||
        trimmedLine.match(/^[A-Z][A-Z\s&-]+:?$/) ||
        trimmedLine.includes('REVA UNIVERSITY') ||
        trimmedLine.includes('KEY POINTS') ||
        trimmedLine.includes('DETAILED INFORMATION') ||
        trimmedLine.includes('MAIN TOPIC') ||
        trimmedLine.includes('OVERVIEW') ||
        trimmedLine.includes('ACADEMICS') ||
        trimmedLine.includes('PLACEMENTS') ||
        trimmedLine.includes('FACILITIES') ||
        trimmedLine.includes('CAMPUS LIFE') ||
        trimmedLine.includes('ADMISSIONS')
      ) {
        elements.push(
          <h1 key={currentIndex++} className={cn(
            "text-lg font-bold mt-5 mb-3 pb-2 border-b flex items-center gap-2",
            isLight 
              ? "text-blue-700 border-blue-200" 
              : "text-blue-300 border-blue-600"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              isLight ? "bg-blue-500" : "bg-blue-400"
            )} />
            {trimmedLine.replace(/^MAIN TOPIC - /, '').replace(/:$/, '')}
          </h1>
        );
        continue;
      }

      // Sub-headers (with --- separators or specific patterns)
      if (
        trimmedLine.includes('---') ||
        trimmedLine.match(/^[A-Z][a-zA-Z\s&-]+:$/) ||
        (trimmedLine.endsWith(':') && trimmedLine.length < 50 && !trimmedLine.includes('•'))
      ) {
        if (trimmedLine.includes('---')) {
          elements.push(
            <div key={currentIndex++} className="my-3">
              <div className={cn(
                "w-full h-px",
                isLight ? "bg-gray-300" : "bg-gray-600"
              )} />
            </div>
          );
        } else {
          elements.push(
            <h2 key={currentIndex++} className={cn(
              "text-lg font-semibold mt-4 mb-2",
              isLight ? "text-gray-700" : "text-gray-200"
            )}>
              {trimmedLine.replace(/:$/, '')}
            </h2>
          );
        }
        continue;
      }

      // Bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const bulletContent = trimmedLine.replace(/^[•\-*]\s*/, '');
        elements.push(
          <div key={currentIndex++} className="flex items-start gap-3 mb-2 ml-2">
            <span className={cn(
              "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
              isLight ? "bg-green-500" : "bg-green-400"
            )} />
            <p className={cn(
              "text-sm leading-relaxed",
              isLight ? "text-gray-700" : "text-gray-300"
            )}>
              {bulletContent}
            </p>
          </div>
        );
        continue;
      }

      // Numbered lists
      if (trimmedLine.match(/^\d+\.\s/)) {
        const listContent = trimmedLine.replace(/^\d+\.\s*/, '');
        const number = trimmedLine.match(/^(\d+)\./)?.[1];
        elements.push(
          <div key={currentIndex++} className="flex items-start gap-3 mb-2 ml-4">
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5",
              isLight 
                ? "bg-blue-100 text-blue-700" 
                : "bg-blue-900 text-blue-300"
            )}>
              {number}
            </span>
            <p className={cn(
              "text-sm leading-relaxed",
              isLight ? "text-gray-700" : "text-gray-300"
            )}>
              {listContent}
            </p>
          </div>
        );
        continue;
      }

      // Regular paragraphs
      if (trimmedLine.length > 0) {
        // Process bold text and other inline formatting
        const processInlineFormatting = (text: string) => {
          // Handle **bold** text
          let parts = text.split(/(\*\*[^*]+\*\*)/g);
          
          // Process each part for additional formatting
          return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={index} className={cn(
                  "font-semibold",
                  isLight ? "text-gray-800" : "text-gray-100"
                )}>
                  {part.slice(2, -2)}
                </strong>
              );
            }
            
            // Highlight numbers and percentages
            const numberRegex = /(\d+(?:,\d{3})*(?:\.\d+)?%?|\d+\+?)/g;
            const textParts = part.split(numberRegex);
            
            return textParts.map((textPart, textIndex) => {
              if (numberRegex.test(textPart)) {
                return (
                  <span key={`${index}-${textIndex}`} className={cn(
                    "font-semibold px-1 py-0.5 rounded text-xs",
                    isLight 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-blue-900 text-blue-300"
                  )}>
                    {textPart}
                  </span>
                );
              }
              return textPart;
            });
          });
        };

        elements.push(
          <p key={currentIndex++} className={cn(
            "text-sm leading-relaxed mb-3",
            isLight ? "text-gray-700" : "text-gray-300"
          )}>
            {processInlineFormatting(trimmedLine)}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      {parseContent(content)}
    </div>
  );
}; 