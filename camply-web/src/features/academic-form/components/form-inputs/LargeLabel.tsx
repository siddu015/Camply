import { cn } from '@/lib/utils';

interface LargeLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const LargeLabel = ({ children, className, ...props }: LargeLabelProps) => {
  return (
    <label 
      className={cn(
        "form-label-responsive text-white drop-shadow-sm transition-smooth block",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
};
