'use client';

import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/lib/theme-provider';

export type BundledLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'swift'
  | 'kotlin'
  | 'sql'
  | 'html'
  | 'css'
  | 'scss'
  | 'sass'
  | 'json'
  | 'xml'
  | 'yaml'
  | 'markdown'
  | 'bash'
  | 'shell'
  | 'powershell'
  | 'dockerfile'
  | 'nginx'
  | 'apache'
  | 'regex'
  | 'text';

export interface CodeBlockData {
  language: string;
  filename: string;
  code: string;
}

export interface CodeBlockProps extends HTMLAttributes<HTMLDivElement> {
  data: CodeBlockData[];
  defaultValue?: string;
}

export interface CodeBlockContentProps {
  language: BundledLanguage;
  children: string;
}

export function CodeBlockContent({ language, children }: CodeBlockContentProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const processInlineFormatting = (text: string) => {
    const numberRegex = /(\d+(?:,\d{3})*(?:\.\d+)?[%₹$]?|\d+\+?)/g;
    const textParts = text.split(numberRegex);
    
    return textParts.map((textPart, textIndex) => {
      if (numberRegex.test(textPart)) {
        return (
          <span 
            key={textIndex} 
            className={cn(
              "font-bold px-1 py-0.5 rounded text-xs inline-block mx-0.5",
              isDark 
                ? "bg-blue-900 text-blue-300" 
                : "bg-blue-100 text-blue-700"
            )}
          >
            {textPart}
          </span>
        );
      }
      return textPart;
    });
  };

  if (language === 'text' || language === 'markdown') {
    return (
      <pre className="text-sm leading-relaxed p-4 overflow-x-auto">
        <code className="font-mono">
          {processInlineFormatting(children)}
        </code>
      </pre>
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const styleNumbers = () => {
      const numberRegex = /^\d+(?:,\d{3})*(?:\.\d+)?[%₹$]?$|^\d+\+?$/;
      const container = containerRef.current;
      if (!container) return;

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node as Text);
      }

      textNodes.forEach((textNode) => {
        const text = textNode.textContent || '';
        if (numberRegex.test(text.trim())) {
          const span = document.createElement('span');
          span.className = cn(
            "font-bold px-1 py-0.5 rounded text-xs inline-block mx-0.5",
            isDark 
              ? "bg-blue-900 text-blue-300" 
              : "bg-blue-100 text-blue-700"
          );
          span.style.cssText = `
            font-weight: 700 !important;
            padding: 2px 4px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            display: inline-block !important;
            margin: 0 2px !important;
            background-color: ${isDark ? '#1e3a8a' : '#dbeafe'} !important;
            color: ${isDark ? '#93c5fd' : '#1d4ed8'} !important;
          `;
          span.textContent = text;
          textNode.parentNode?.replaceChild(span, textNode);
        }
      });
    };
                
    const timer = setTimeout(styleNumbers, 100);
    return () => clearTimeout(timer);
  }, [children, isDark, theme]);

  return (
    <div ref={containerRef} className="relative">
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          background: 'transparent',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
        wrapLongLines
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

export function CodeBlockCopyButton({ 
  onCopy, 
  onError 
}: { 
  onCopy: () => void; 
  onError: () => void; 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      onError();
    }
  }, [onCopy, onError]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "h-9 w-9 hover:bg-muted"
      )}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

export function CodeBlockHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
      {children}
    </div>
  );
}

export function CodeBlockBody({ children }: { 
  children: ReactNode 
}) {
  return <div className="relative">{children}</div>;
}

export function CodeBlockFiles({ children }: { 
  children: ReactNode 
}) {
  return <div className="flex items-center space-x-2">{children}</div>;
}

export function CodeBlockFilename({ 
  value, 
  children 
}: { 
  value: string; 
  children: ReactNode 
}) {
  return <span className="text-sm font-medium">{children}</span>;
}

export function CodeBlockSelect({ children }: { children: ReactNode }) {
  return <div className="flex items-center space-x-2">{children}</div>;
}

export function CodeBlockSelectTrigger({ children }: { children: ReactNode }) {
  return (
    <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
      {children}
    </button>
  );
}

export function CodeBlockSelectValue() {
  return <span>Language</span>;
}

export function CodeBlockSelectContent({ children }: { 
  children: ReactNode 
}) {
  return <div className="relative">{children}</div>;
}

export function CodeBlockSelectItem({ 
  value, 
  children 
}: { 
  value: string; 
  children: ReactNode 
}) {
  return <div className="px-2 py-1 text-sm">{children}</div>;
}

export function CodeBlockItem({ 
  value, 
  children 
}: { 
  value: string; 
  children: ReactNode 
}) {
  return <div className="p-4 overflow-x-auto">{children}</div>;
}

export const CodeBlock = memo(({ 
  className, 
  data, 
  defaultValue, 
  children, 
  ...props 
}: CodeBlockProps & { children?: ReactNode }) => {
  const [currentValue, setCurrentValue] = useState(defaultValue || data[0]?.language);
  const currentItem = data.find(item => item.language === currentValue) || data[0];

  return (
    <div
      className={cn(
        "rounded-lg border bg-background overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock'; 