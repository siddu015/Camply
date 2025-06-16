import type { LucideIcon } from 'lucide-react';
import { cn } from '@/components/sidebar/lib/utils';

interface CampusFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  onClick: () => void;
}

export function CampusFeatureCard({
  title,
  description,
  icon: Icon,
  gradient,
  onClick
}: CampusFeatureCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col h-full bg-card hover:bg-accent/5 border border-border hover:border-primary/20 rounded-xl transition-all duration-300 overflow-hidden"
    >
      {/* Gradient Overlay */}
      <div className={cn(
        "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500",
        gradient
      )} />
      
      {/* Content */}
      <div className="relative p-6 flex flex-col h-full">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110",
          gradient,
          "shadow-[0_8px_16px_rgb(0_0_0_/_0.1)] group-hover:shadow-[0_12px_24px_rgb(0_0_0_/_0.15)]"
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>

        {/* Text Content */}
        <div className="flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors leading-relaxed flex-grow">
            {description}
          </p>
        </div>

        {/* Bottom Border Gradient */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0",
          gradient
        )} />
      </div>
    </button>
  );
} 