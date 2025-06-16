"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useScroll,
  useSpring,
} from "motion/react";
import { cn } from "@/lib/utils";

export const TracingBeam = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
                    
  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        setSvgHeight(contentRef.current.offsetHeight);
      }
    };

    updateHeight();

    const observer = new MutationObserver(updateHeight);
    if (contentRef.current) {
      observer.observe(contentRef.current, { 
        childList: true, 
        subtree: true,
        characterData: true,
        attributes: true 
      });
    }

    const handleScroll = () => {
      if (window.scrollY > -100) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [children]); 

  useEffect(() => {
    const handleResize = () => {
      if (contentRef.current) {
        setSvgHeight(contentRef.current.offsetHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const y1 = useSpring(
    useTransform(scrollYProgress, 
      [0, 0.05, 0.8, 1], 
      [-10, 20, svgHeight * 0.5, svgHeight * 0.8]
    ),
    {
      stiffness: 500,
      damping: 90,
    }
  );
  
  const y2 = useSpring(
    useTransform(scrollYProgress, 
      [0, 0.05, 0.8, 1], 
      [0, 70, svgHeight * 0.6, svgHeight]
    ),
    {
      stiffness: 500,
      damping: 90,
    }
  );

  return (
    <motion.div
      ref={ref}
      className={cn("relative mx-auto h-full w-full", className)}
    >
      <div className="sticky top-24 h-full">
        <div className="absolute -left-4 md:-left-20 lg:-left-24 h-full">
          <motion.div
            transition={{
              duration: 0.2,
              delay: 0.5,
            }}
            animate={{
              boxShadow:
                scrollYProgress.get() > 0
                  ? "none"
                  : "rgba(0, 0, 0, 0.24) 0px 3px 8px",
            }}
            className="border-netural-200 ml-[27px] flex h-5 w-5 items-center justify-center rounded-full border shadow-sm"
          >
            <motion.div
              transition={{
                duration: 0.2,
                delay: 0.5,
              }}
              animate={{
                backgroundColor: hasScrolled ? "white" : "#10b981",
                borderColor: hasScrolled ? "white" : "#059669",
              }}
              className="h-3 w-3 rounded-full border border-neutral-300 bg-white"
            />
          </motion.div>
          <svg
            viewBox={`0 0 20 ${Math.max(svgHeight, 100)}`}
            width="20"
            height={Math.max(svgHeight, 100)}
            className="ml-4 block"
            aria-hidden="true"
            style={{ minHeight: '100vh' }}
          >
            <motion.path
              d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
              fill="none"
              stroke="#9091A0"
              strokeOpacity="0.16"
              transition={{
                duration: 10,
              }}
            ></motion.path>
            
            <motion.path
              d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="1.5"
              className="motion-reduce:hidden"
              transition={{
                duration: 10,
              }}
            ></motion.path>
            
            <defs>
              <motion.linearGradient
                id="gradient"
                gradientUnits="userSpaceOnUse"
                x1="0"
                x2="0"
                y1={y1} 
                y2={y2} 
              >
                <stop stopColor="#18CCFC" stopOpacity="0"></stop>
                <stop stopColor="#18CCFC"></stop>
                <stop offset="0.325" stopColor="#6344F5"></stop>
                <stop offset="1" stopColor="#AE48FF" stopOpacity="0"></stop>
              </motion.linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div ref={contentRef} className="relative">
        {children}
        <div className="h-24" />
      </div>
    </motion.div>
  );
}; 