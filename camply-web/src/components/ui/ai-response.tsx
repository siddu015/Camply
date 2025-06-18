'use client';
import { cn } from '@/lib/utils';
import {
  type BundledLanguage,
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockFiles,
  CodeBlockHeader,
  CodeBlockItem,
  type CodeBlockProps,
  CodeBlockSelect,
  CodeBlockSelectContent,
  CodeBlockSelectItem,
  CodeBlockSelectTrigger,
  CodeBlockSelectValue,
} from '@/components/ui/kibo-ui/code-block';
import { memo } from 'react';
import type { HTMLAttributes } from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '@/lib/theme-provider';

export type AIResponseProps = HTMLAttributes<HTMLDivElement> & {
  options?: Options;
  children: Options['children'];
};

const enhanceTextWithNumbers = (text: string, isLight: boolean): React.ReactNode[] => {
  if (typeof text !== 'string') return [text];
  
  const numberRegex = /(\d+(?:,\d{3})*(?:\.\d+)?%?|\d+\+?)/g;
  const textParts = text.split(numberRegex);
  
  return textParts.map((textPart, textIndex) => {
    if (numberRegex.test(textPart)) {
      return (
        <span key={`number-${textIndex}`} className={cn(
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
};

const AIResponseComponent = ({ className, options, children, ...props }: AIResponseProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const components: Options['components'] = {
    ol: ({ node, children, className, ...props }) => (
      <ol className={cn('space-y-1 list-none', className)} {...props}>
        {children}
      </ol>
    ),
    li: ({ node, children, className, ...props }) => {
      const nodeData = node as any;
      const isOrderedList = nodeData?.tagName === 'li' && nodeData?.parent?.tagName === 'ol';
      
      if (isOrderedList) {
        const siblings = nodeData?.parent?.children?.filter((child: any) => child.tagName === 'li') || [];
        const itemIndex = siblings.indexOf(nodeData) + 1;
        
        return (
          <li className={cn('flex items-start gap-3 mb-2 ml-4', className)} {...props}>
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5",
              isLight 
                ? "bg-blue-100 text-blue-700" 
                : "bg-blue-900 text-blue-300"
            )}>
              {itemIndex > 0 ? itemIndex : '•'}
            </span>
            <div className="flex-1">
              {typeof children === 'string' ? enhanceTextWithNumbers(children, isLight) : children}
            </div>
          </li>
        );
      }
              
      return (
        <li className={cn('flex items-start gap-3 mb-2 ml-2', className)} {...props}>
          <span className={cn(
            "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
            isLight ? "bg-green-500" : "bg-green-400"
          )} />
          <div className="flex-1">
            {typeof children === 'string' ? enhanceTextWithNumbers(children, isLight) : children}
          </div>
        </li>
      );
    },
    ul: ({ node, children, className, ...props }) => (
      <ul className={cn('space-y-1 list-none', className)} {...props}>
        {children}
      </ul>
    ),
    strong: ({ node, children, className, ...props }) => (
      <span className={cn('font-semibold', className)} {...props}>
        {children}
      </span>
    ),
    p: ({ node, children, className, ...props }) => {
      const processContent = (content: any): any => {
        if (typeof content === 'string') {
          return enhanceTextWithNumbers(content, isLight);
        }
        if (Array.isArray(content)) {
          return content.map((item, index) => 
            typeof item === 'string' ? enhanceTextWithNumbers(item, isLight) : item
          );
        }
        return content;
      };

      return (
        <p className={cn('leading-relaxed mb-4', className)} {...props}>
          {processContent(children)}
        </p>
      );
    },
    a: ({ node, children, className, ...props }) => (
      <a
        className={cn('font-medium text-primary underline hover:text-primary/80 transition-colors', className)}
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    h1: ({ node, children, className, ...props }) => (
      <h1
        className={cn('mt-6 mb-3 font-bold text-xl', isLight ? 'text-gray-900' : 'text-gray-50', className)}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ node, children, className, ...props }) => (
      <h2
        className={cn('mt-5 mb-2 font-bold text-lg', isLight ? 'text-gray-900' : 'text-gray-50', className)}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ node, children, className, ...props }) => (
      <h3 className={cn('mt-4 mb-2 font-semibold text-base', isLight ? 'text-gray-900' : 'text-gray-100', className)} {...props}>
        {children}
      </h3>
    ),
    h4: ({ node, children, className, ...props }) => (
      <h4 className={cn('mt-3 mb-2 font-semibold text-sm', isLight ? 'text-gray-800' : 'text-gray-200', className)} {...props}>
        {children}
      </h4>
    ),
    h5: ({ node, children, className, ...props }) => (
      <h5
        className={cn('mt-3 mb-1 font-semibold text-sm', isLight ? 'text-gray-800' : 'text-gray-200', className)}
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ node, children, className, ...props }) => (
      <h6 className={cn('mt-2 mb-1 font-semibold text-xs', isLight ? 'text-gray-700' : 'text-gray-300', className)} {...props}>
        {children}
      </h6>
    ),
    blockquote: ({ node, children, className, ...props }) => (
      <blockquote 
        className={cn(
          'my-6 border-l-4 pl-6 italic',
          isLight ? 'border-gray-300 text-gray-600' : 'border-gray-600 text-gray-400',
          className
        )} 
        {...props}
      >
        {children}
      </blockquote>
    ),
    table: ({ node, children, className, ...props }) => (
      <div className="my-6 overflow-x-auto">
        <table 
          className={cn(
            'w-full border-collapse',
            isLight ? 'text-gray-700' : 'text-gray-300',
            className
          )} 
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ node, children, className, ...props }) => (
      <th 
        className={cn(
          'border py-2 px-4 text-left font-semibold',
          isLight ? 'border-gray-300 bg-gray-50' : 'border-gray-700 bg-gray-800',
          className
        )} 
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ node, children, className, ...props }) => (
      <td 
        className={cn(
          'border py-2 px-4',
          isLight ? 'border-gray-300' : 'border-gray-700',
          className
        )} 
        {...props}
      >
        {children}
      </td>
    ),
    hr: ({ node, className, ...props }) => (
      <hr 
        className={cn(
          'my-8 border-t',
          isLight ? 'border-gray-200' : 'border-gray-800',
          className
        )} 
        {...props} 
      />
    ),
    pre: ({ node, className, children }) => {
      let language = 'javascript';
      if (typeof node?.properties?.className === 'string') {
        language = node.properties.className.replace('language-', '');
      }
      const childrenIsCode =
        typeof children === 'object' &&
        children !== null &&
        'type' in children &&
        children.type === 'code';
      if (!childrenIsCode) {
        return <pre>{children}</pre>;
      }
      const data: CodeBlockProps['data'] = [
        {
          language,
          filename: 'index.js',
          code: (children.props as { children: string }).children,
        },
      ];
      
      const handleCopy = () => {
        navigator.clipboard.writeText(data[0].code);
      };
      
      const handleError = () => {
        console.error('Failed to copy code to clipboard');
      };
      
      return (
        <CodeBlock
          className={cn('my-4 h-auto', className)}
          data={data}
          defaultValue={data[0].language}
        >
          <CodeBlockHeader>
            <CodeBlockFiles>
              <CodeBlockFilename value={data[0].language}>
                {data[0].filename}
              </CodeBlockFilename>
            </CodeBlockFiles>
            <CodeBlockSelect>
              <CodeBlockSelectTrigger>
                <CodeBlockSelectValue />
              </CodeBlockSelectTrigger>
              <CodeBlockSelectContent>
                <CodeBlockSelectItem value={data[0].language}>
                  {data[0].language}
                </CodeBlockSelectItem>
              </CodeBlockSelectContent>
            </CodeBlockSelect>
            <CodeBlockCopyButton
              onCopy={handleCopy}
              onError={handleError}
            />
          </CodeBlockHeader>
          <CodeBlockBody>
            <CodeBlockItem value={data[0].language}>
              <CodeBlockContent language={data[0].language as BundledLanguage}>
                {data[0].code}
              </CodeBlockContent>
            </CodeBlockItem>
          </CodeBlockBody>
        </CodeBlock>
      );
    },
    code: ({ node, className, children, ...props }) => (
      <code
        className={cn(
          'px-1.5 py-0.5 rounded text-sm font-mono',
          isLight ? 'bg-gray-100 text-gray-800' : 'bg-gray-800 text-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </code>
    ),
  };

  return (
    <div
      className={cn(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className
      )}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        {...options}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const AIResponse = memo(AIResponseComponent, (prevProps, nextProps) => 
  prevProps.children === nextProps.children
);

AIResponse.displayName = 'AIResponse'; 