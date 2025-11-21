import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-label="Crack The Code Logo"
    >
      {/* Outer squircle container for app-icon feel */}
      <rect 
        x="10" 
        y="10" 
        width="80" 
        height="80" 
        rx="22" 
        className="fill-secondary-accent/10 dark:fill-primary-accent/10 stroke-secondary-accent/20 dark:stroke-primary-accent/20 stroke-2" 
      />
      
      {/* Lock Shackle - futuristic connection style */}
      <path 
        d="M35 40V30C35 21.7157 41.7157 15 50 15C58.2843 15 65 21.7157 65 30V40" 
        className="stroke-secondary-accent dark:stroke-primary-accent" 
        strokeWidth="8" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Lock Body */}
      <rect 
        x="25" 
        y="40" 
        width="50" 
        height="45" 
        rx="12" 
        className="fill-secondary-accent dark:fill-primary-accent drop-shadow-sm" 
      />
      
      {/* The 'Code' - 3 dots representing the hidden numbers */}
      <g className="fill-white dark:fill-dark-bg">
        <circle cx="38" cy="62.5" r="4" />
        <circle cx="50" cy="62.5" r="4" />
        <circle cx="62" cy="62.5" r="4" />
      </g>
      
      {/* Shine reflection effect on lock body */}
      <path 
        d="M25 52C25 45.3726 30.3726 40 37 40H63C69.6274 40 75 45.3726 75 52V55C75 55 65 48 50 48C35 48 25 55 25 55V52Z" 
        fill="white" 
        fillOpacity="0.1" 
      />
    </svg>
  );
};