import React from "react";
import { motion } from "motion/react";

interface LogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

/**
 * JanataPulseIcon - The core graphical mark of the brand.
 * Consists of:
 * 1. A blue/teal heart/pulse ECG wave on the left.
 * 2. Three stylized community members in the center.
 * 3. A rising growth arrow shooting up-right, overlaid gracefully.
 */
export const JanataPulseIcon: React.FC<LogoProps> = ({
  className = "",
  size = 120,
  animate = true,
}) => {
  // Animation variants
  const pulseVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.5, ease: "easeInOut" },
    },
  };

  const personVariants = (delay: number) => ({
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { delay, duration: 0.6, ease: "easeOut" },
    },
  });

  const arrowVariants = {
    hidden: { pathLength: 0, opacity: 0, scale: 0.95 },
    visible: {
      pathLength: 1,
      opacity: 1,
      scale: 1,
      transition: { delay: 0.8, duration: 1.2, ease: "easeOut" },
    },
  };

  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      id="janatapulse-vector-logo"
    >
      <defs>
        {/* Gradients to perfectly replicate the modern styling */}
        <linearGradient id="pulseLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" /> {/* Deep Blue */}
          <stop offset="50%" stopColor="#0f766e" /> {/* Teal */}
          <stop offset="100%" stopColor="#0d9488" /> {/* Aqua Teal */}
        </linearGradient>

        <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f766e" /> {/* Teal */}
          <stop offset="50%" stopColor="#0d9488" /> {/* Aqua Teal */}
          <stop offset="100%" stopColor="#10b981" /> {/* Bright Greenish Teal */}
        </linearGradient>

        {/* Gradients for the three people */}
        <linearGradient id="personLeftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#1e3b8a" />
        </linearGradient>

        <linearGradient id="personMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>

        <linearGradient id="personRightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      {/* --- BACKGROUND GROUP FOR DECORATION --- */}
      {/* 1. Pulse Waveform (ECG Heartbeat line) on the left */}
      <motion.path
        d="M 12 95 H 35 L 42 70 L 49 120 L 56 45 L 63 140 L 70 85 L 76 105 H 90 L 96 95 H 105"
        stroke="url(#pulseLineGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={animate ? pulseVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />

      {/* 2. Three Stylized People in the center-right */}
      {/* Left Person */}
      <g id="person-left">
        <motion.circle
          cx="108"
          cy="74"
          r="9"
          fill="url(#personLeftGrad)"
          variants={animate ? personVariants(0.4) : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
        <motion.path
          d="M 94 112 C 94 92, 122 92, 122 112 Z"
          fill="url(#personLeftGrad)"
          variants={animate ? personVariants(0.4) : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
      </g>

      {/* Right Person */}
      <g id="person-right">
        <motion.circle
          cx="148"
          cy="74"
          r="9"
          fill="url(#personRightGrad)"
          variants={animate ? personVariants(0.6) : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
        <motion.path
          d="M 134 112 C 134 92, 162 92, 162 112 Z"
          fill="url(#personRightGrad)"
          variants={animate ? personVariants(0.6) : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
      </g>

      {/* Middle Person (Foreground/Hero) */}
      <g id="person-mid">
        <motion.circle
          cx="128"
          cy="60"
          r="12"
          fill="url(#personMidGrad)"
          variants={animate ? personVariants(0.2) : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
        <motion.path
          d="M 110 108 C 110 84, 146 84, 146 108 Z"
          fill="url(#personMidGrad)"
          variants={animate ? personVariants(0.2) : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
      </g>

      {/* 3. Rising Dynamic Arrow scaling up-right */}
      <g id="growth-arrow">
        {/* Underlay shadow/glow for the arrow */}
        <motion.path
          d="M 52 115 L 74 115 L 94 85 L 118 135 L 146 72 L 180 125 L 222 45"
          stroke="#10b981"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.15"
          variants={animate ? arrowVariants : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
        {/* Main Arrow Line */}
        <motion.path
          d="M 52 115 Q 75 115 94 85 T 120 125 Q 145 75 180 120 L 220 46"
          stroke="url(#arrowGrad)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={animate ? arrowVariants : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
        {/* Arrow Head */}
        <motion.path
          d="M 194 48 L 222 44 L 218 72 Z"
          fill="url(#arrowGrad)"
          variants={animate ? arrowVariants : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
      </g>
    </svg>
  );
};

/**
 * JanataPulseLogoStacked - Full logo containing the animated icon
 * with "JanataPulse AI" text beautifully stylized underneath.
 */
export const JanataPulseLogoStacked: React.FC<{
  className?: string;
  size?: number;
  animate?: boolean;
}> = ({ className = "", size = 160, animate = true }) => {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <JanataPulseIcon size={size} animate={animate} />
      <motion.div
        initial={animate ? { opacity: 0, y: 10 } : undefined}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 1.0, duration: 0.8 }}
        className="mt-2"
      >
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display flex items-center justify-center gap-1">
          <span className="text-blue-900">Janata</span>
          <span className="text-teal-600">Pulse</span>
        </h1>
        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-0.5">
          AI Civic Planning
        </p>
      </motion.div>
    </div>
  );
};

/**
 * JanataPulseLogoHorizontal - Compact header-style logo containing the animated icon
 * on the left and the brand name on the right.
 */
export const JanataPulseLogoHorizontal: React.FC<{
  className?: string;
  iconSize?: number;
  animate?: boolean;
}> = ({ className = "", iconSize = 40, animate = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <JanataPulseIcon size={iconSize} animate={animate} />
      <div className="flex flex-col">
        <h1 className="text-base font-extrabold text-slate-900 font-display leading-none flex items-center gap-1">
          <span className="text-blue-900">Janata</span>
          <span className="text-teal-600">Pulse</span>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-500 text-white uppercase tracking-wider scale-90 origin-left">
            AI
          </span>
        </h1>
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
          Madurai Constituency Planning Engine
        </p>
      </div>
    </div>
  );
};
