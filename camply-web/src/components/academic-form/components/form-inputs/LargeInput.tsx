import { useState } from 'react';
import { useMotionTemplate, useMotionValue, motion } from "framer-motion";
import { cn } from '../../../../lib/utils';

interface LargeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
}

export const LargeInput = ({ disabled = false, ...props }: LargeInputProps) => {
  const radius = 100;
  const [visible, setVisible] = useState(false);

  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: any) => {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      style={{
        background: useMotionTemplate`
          radial-gradient(
            ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
            rgba(255, 255, 255, 0.2),
            transparent 80%
          )
        `,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input rounded-lg p-[2px] transition duration-300"
    >
      <input
        {...props}
        disabled={disabled}
        className={cn(
          "flex h-12 md:h-14 w-full rounded-md border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 text-base md:text-lg text-white transition duration-400 group-hover/input:shadow-lg file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[2px] focus-visible:ring-white/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 shadow-lg relative placeholder:text-white/50",
          "before:absolute before:inset-0 before:rounded-md before:opacity-10 before:mix-blend-soft-light before:pointer-events-none",
          `before:bg-[url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")]`,
          disabled && "bg-white/2 cursor-not-allowed opacity-50",
          props.className
        )}
      />
    </motion.div>
  );
}; 