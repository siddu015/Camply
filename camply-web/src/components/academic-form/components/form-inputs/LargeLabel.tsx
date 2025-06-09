import { cn } from '../../../../lib/utils';

interface LargeLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const LargeLabel = ({ children, ...props }: LargeLabelProps) => (
  <label 
    {...props}
    className={cn(
      "text-xl md:text-2xl font-semibold text-white drop-shadow-lg mb-3 block",
      props.className
    )}
  >
    {children}
  </label>
); 