import { useState } from 'react';
import { useMotionTemplate, useMotionValue, motion } from "framer-motion";
import { cn } from '@/lib/utils';

interface LargeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
}

export const LargeInput = ({ disabled = false, ...props }: LargeInputProps) => {
  const radius = 100;
  const [visible, setVisible] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: any) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

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
      <input
        {...props}
        disabled={disabled}
        className={cn(
          "form-input-responsive w-full",
          "border border-white/10 bg-white/[0.015] backdrop-blur-sm text-white transition-smooth",
          "group-hover/input:shadow-lg file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "focus-visible:ring-[2px] focus-visible:ring-white/30 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50 shadow-lg relative placeholder:text-white/50",
          "touch-target",
          disabled && "bg-white/[0.008] cursor-not-allowed opacity-50",
          props.className
        )}
      />
    </motion.div>
  );
};
