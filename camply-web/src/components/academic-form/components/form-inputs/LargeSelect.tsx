import { useState } from 'react';
import { useMotionTemplate, useMotionValue, motion } from "framer-motion";
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface LargeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  disabled?: boolean;
}

export const LargeSelect = ({ children, disabled = false, ...props }: LargeSelectProps) => {
  const radius = 100;
  const [visible, setVisible] = useState(false);

  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: any) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      style={{
        background: useMotionTemplate`
          radial-gradient(
            ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
            rgba(255, 255, 255, 0.15),
            transparent 80%
          )
        `,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input rounded-md sm:rounded-lg p-[1px] sm:p-[2px] transition-smooth"
    >
      <div className="relative">
        <select
          {...props}
          disabled={disabled}
          className={cn(
            "form-input-responsive w-full pr-8 sm:pr-10 md:pr-12",
            "border border-white/10 bg-white/[0.02] backdrop-blur-md text-white transition-smooth",
            "group-hover/input:shadow-lg file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "focus-visible:ring-[2px] focus-visible:ring-white/30 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50 appearance-none shadow-lg relative",
            "before:absolute before:inset-0 before:rounded-md before:opacity-10 before:mix-blend-soft-light before:pointer-events-none",
            `before:bg-[url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")]`,
            "touch-target", // Ensures minimum touch target size
            disabled && "bg-white/[0.01] cursor-not-allowed opacity-50"
          )}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-3 sm:right-4 flex items-center pointer-events-none">
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white/70 rotate-90" />
        </div>
      </div>
    </motion.div>
  );
}; 