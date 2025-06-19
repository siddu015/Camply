import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';

interface SimpleLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const SimpleLoader = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = true 
}: SimpleLoaderProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  };

  const containerClasses = fullScreen 
    ? "w-full h-screen flex flex-col items-center justify-center bg-background"
    : "flex flex-col items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <style>
        {`
          .pl-ring-a {
            animation: ringA 2s linear infinite;
          }

          .pl-ring-b {
            animation: ringB 2s linear infinite;
          }

          .pl-ring-c {
            animation: ringC 2s linear infinite;
          }

          .pl-ring-d {
            animation: ringD 2s linear infinite;
          }

          @keyframes ringA {
            from, 4% {
              stroke-dasharray: 0 660;
              stroke-width: 20;
              stroke-dashoffset: -330;
            }
            12% {
              stroke-dasharray: 60 600;
              stroke-width: 30;
              stroke-dashoffset: -335;
            }
            32% {
              stroke-dasharray: 60 600;
              stroke-width: 30;
              stroke-dashoffset: -595;
            }
            40%, 54% {
              stroke-dasharray: 0 660;
              stroke-width: 20;
              stroke-dashoffset: -660;
            }
            62% {
              stroke-dasharray: 60 600;
              stroke-width: 30;
              stroke-dashoffset: -665;
            }
            82% {
              stroke-dasharray: 60 600;
              stroke-width: 30;
              stroke-dashoffset: -925;
            }
            90%, to {
              stroke-dasharray: 0 660;
              stroke-width: 20;
              stroke-dashoffset: -990;
            }
          }

          @keyframes ringB {
            from, 12% {
              stroke-dasharray: 0 220;
              stroke-width: 20;
              stroke-dashoffset: -110;
            }
            20% {
              stroke-dasharray: 20 200;
              stroke-width: 30;
              stroke-dashoffset: -115;
            }
            40% {
              stroke-dasharray: 20 200;
              stroke-width: 30;
              stroke-dashoffset: -195;
            }
            48%, 62% {
              stroke-dasharray: 0 220;
              stroke-width: 20;
              stroke-dashoffset: -220;
            }
            70% {
              stroke-dasharray: 20 200;
              stroke-width: 30;
              stroke-dashoffset: -225;
            }
            90% {
              stroke-dasharray: 20 200;
              stroke-width: 30;
              stroke-dashoffset: -305;
            }
            98%, to {
              stroke-dasharray: 0 220;
              stroke-width: 20;
              stroke-dashoffset: -330;
            }
          }

          @keyframes ringC {
            from {
              stroke-dasharray: 0 440;
              stroke-width: 20;
              stroke-dashoffset: 0;
            }
            8% {
              stroke-dasharray: 40 400;
              stroke-width: 30;
              stroke-dashoffset: -5;
            }
            28% {
              stroke-dasharray: 40 400;
              stroke-width: 30;
              stroke-dashoffset: -175;
            }
            36%, 58% {
              stroke-dasharray: 0 440;
              stroke-width: 20;
              stroke-dashoffset: -220;
            }
            66% {
              stroke-dasharray: 40 400;
              stroke-width: 30;
              stroke-dashoffset: -225;
            }
            86% {
              stroke-dasharray: 40 400;
              stroke-width: 30;
              stroke-dashoffset: -395;
            }
            94%, to {
              stroke-dasharray: 0 440;
              stroke-width: 20;
              stroke-dashoffset: -440;
            }
          }

          @keyframes ringD {
            from, 8% {
              stroke-dasharray: 0 440;
              stroke-width: 20;
              stroke-dashoffset: 0;
            }
            16% {
              stroke-dasharray: 40 400;
              stroke-width: 30;
              stroke-dashoffset: -5;
            }
            36% {
              stroke-dasharray: 40 400;
              stroke-width: 30;
              stroke-dashoffset: -175;
            }
            44%, 50% {
              stroke-dasharray: 0 440;
              stroke-width: 20;
              stroke-dashoffset: -220;
            }
            58% {
              stroke-dasharray: 40 400;
              stroke-width: 30;
              stroke-dashoffset: -225;
            }
            78% {
              stroke-dasharray: 40 400;
              stroke-width: 30;
              stroke-dashoffset: -395;
            }
            86%, to {
              stroke-dasharray: 0 440;
              stroke-width: 20;
              stroke-dashoffset: -440;
            }
          }
        `}
      </style>
      
      <div className={cn("relative", sizeClasses[size])}>
        <svg viewBox="0 0 240 240" className="w-full h-full">
          <circle 
            strokeLinecap="round" 
            strokeDashoffset={-330} 
            strokeDasharray="0 660" 
            strokeWidth={20} 
            stroke={isDark ? "#ffffff" : "#000000"} 
            fill="none" 
            r={105} 
            cy={120} 
            cx={120} 
            className="pl-ring-a" 
          />
          <circle 
            strokeLinecap="round" 
            strokeDashoffset={-110} 
            strokeDasharray="0 220" 
            strokeWidth={20} 
            stroke={isDark ? "#a1a1aa" : "#7e7e7e"} 
            fill="none" 
            r={35} 
            cy={120} 
            cx={120} 
            className="pl-ring-b" 
          />
          <circle 
            strokeLinecap="round" 
            strokeDasharray="0 440" 
            strokeWidth={20} 
            stroke={isDark ? "#71717a" : "#686868"} 
            fill="none" 
            r={70} 
            cy={120} 
            cx={85} 
            className="pl-ring-c" 
          />
          <circle 
            strokeLinecap="round" 
            strokeDasharray="0 440" 
            strokeWidth={20} 
            stroke={isDark ? "#ffffff" : "#000000"} 
            fill="none" 
            r={70} 
            cy={120} 
            cx={155} 
            className="pl-ring-d" 
          />
        </svg>
      </div>
      
      <p className={cn(
        "mt-4 text-sm font-medium",
        isDark ? "text-gray-300" : "text-gray-700"
      )}>
        {text}
      </p>
    </div>
  );
};

export default SimpleLoader; 