import React from "react";

interface PCLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const PCLogo: React.FC<PCLogoProps> = ({ size = 28, className = "", ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="logo-pc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="50%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#ec4899" />
        </linearGradient>
      </defs>
      
      {/* Outer Case / Chassis */}
      <rect 
        x="4" 
        y="2" 
        width="16" 
        height="20" 
        rx="3" 
        stroke="url(#logo-pc-grad)" 
        strokeWidth="2.2" 
        strokeLinejoin="round" 
      />
      
      {/* Tempered Glass Panel Divider */}
      <line 
        x1="9" 
        y1="2" 
        x2="9" 
        y2="22" 
        stroke="url(#logo-pc-grad)" 
        strokeWidth="1.5" 
      />
      
      {/* Front Bezel IO Ports / Indicator LEDs */}
      <circle cx="6.5" cy="5" r="0.8" fill="url(#logo-pc-grad)" />
      <circle cx="6.5" cy="7.5" r="0.8" fill="url(#logo-pc-grad)" />
      <circle cx="6.5" cy="10" r="0.8" fill="url(#logo-pc-grad)" />
      
      {/* Internal components (Fans & GPU) */}
      {/* Top Fan */}
      <circle 
        cx="14.5" 
        cy="7.5" 
        r="3" 
        stroke="url(#logo-pc-grad)" 
        strokeWidth="1.2" 
        strokeDasharray="2 1"
      />
      <circle cx="14.5" cy="7.5" r="0.75" fill="url(#logo-pc-grad)" />
      
      {/* Bottom Fan */}
      <circle 
        cx="14.5" 
        cy="15.5" 
        r="3" 
        stroke="url(#logo-pc-grad)" 
        strokeWidth="1.2" 
        strokeDasharray="2 1"
      />
      <circle cx="14.5" cy="15.5" r="0.75" fill="url(#logo-pc-grad)" />
      
      {/* GPU / Expansion Card horizontal line */}
      <line 
        x1="11" 
        y1="11.5" 
        x2="18" 
        y2="11.5" 
        stroke="url(#logo-pc-grad)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
    </svg>
  );
};
