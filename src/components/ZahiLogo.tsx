import React from 'react';

interface ZahiLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const ZahiLogo: React.FC<ZahiLogoProps> = ({ className = "h-10 w-auto", width, height }) => {
  return (
    <svg 
      viewBox="0 0 500 230" 
      className={className} 
      width={width} 
      height={height} 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Outer Oval Gold Gradient */}
        <linearGradient id="goldOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5B842" />
          <stop offset="25%" stopColor="#D48C28" />
          <stop offset="50%" stopColor="#9E5B10" />
          <stop offset="75%" stopColor="#D48C28" />
          <stop offset="100%" stopColor="#F5B842" />
        </linearGradient>

        {/* Ribbon Fold Gradient */}
        <linearGradient id="ribbonDarkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7A3D06" />
          <stop offset="50%" stopColor="#B86B12" />
          <stop offset="100%" stopColor="#7A3D06" />
        </linearGradient>

        {/* Chocolate Background Gradient */}
        <radialGradient id="chocBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5E2A1B" />
          <stop offset="70%" stopColor="#3D180F" />
          <stop offset="100%" stopColor="#2A0F09" />
        </radialGradient>

        {/* Text Drop Shadow Filter */}
        <filter id="shadow3d" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="3" dy="4" stdDeviation="1" floodColor="#180A05" floodOpacity="0.9" />
        </filter>
      </defs>

      {/* Ribbon Left Wing */}
      <path 
        d="M 20 135 L 75 100 L 75 165 L 20 135 Z" 
        fill="#7A3D06" 
      />
      <path 
        d="M 5 110 L 75 90 L 75 175 L 5 155 L 25 132.5 Z" 
        fill="url(#goldOuterGrad)" 
      />

      {/* Ribbon Right Wing */}
      <path 
        d="M 480 135 L 425 100 L 425 165 L 480 135 Z" 
        fill="#7A3D06" 
      />
      <path 
        d="M 495 110 L 425 90 L 425 175 L 495 155 L 475 132.5 Z" 
        fill="url(#goldOuterGrad)" 
      />

      {/* Main Oval Outer Border */}
      <ellipse 
        cx="250" 
        cy="115" 
        rx="200" 
        ry="105" 
        fill="url(#goldOuterGrad)" 
        stroke="#593108" 
        strokeWidth="3"
      />

      {/* Inner Oval Ring */}
      <ellipse 
        cx="250" 
        cy="115" 
        rx="185" 
        ry="92" 
        fill="url(#chocBg)" 
        stroke="#7A420E" 
        strokeWidth="4"
      />

      {/* Inner Dark Rim accent */}
      <ellipse 
        cx="250" 
        cy="115" 
        rx="178" 
        ry="85" 
        fill="none" 
        stroke="#210A05" 
        strokeWidth="3" 
        opacity="0.6"
      />

      {/* ZAHI Main Typography */}
      <g filter="url(#shadow3d)">
        {/* Z */}
        <text 
          x="125" 
          y="150" 
          fontFamily="Arial Black, Impact, sans-serif" 
          fontSize="115" 
          fontWeight="900" 
          fill="#FFFFFF" 
          stroke="#2A0F09" 
          strokeWidth="6" 
          strokeLinejoin="round"
        >
          Z
        </text>

        {/* A */}
        <text 
          x="195" 
          y="145" 
          fontFamily="Arial Black, Impact, sans-serif" 
          fontSize="105" 
          fontWeight="900" 
          fill="#FFFFFF" 
          stroke="#2A0F09" 
          strokeWidth="6" 
          strokeLinejoin="round"
        >
          A
        </text>

        {/* H */}
        <text 
          x="270" 
          y="145" 
          fontFamily="Arial Black, Impact, sans-serif" 
          fontSize="105" 
          fontWeight="900" 
          fill="#FFFFFF" 
          stroke="#2A0F09" 
          strokeWidth="6" 
          strokeLinejoin="round"
        >
          H
        </text>

        {/* I */}
        <text 
          x="345" 
          y="148" 
          fontFamily="Arial Black, Impact, sans-serif" 
          fontSize="110" 
          fontWeight="900" 
          fill="#FFFFFF" 
          stroke="#2A0F09" 
          strokeWidth="6" 
          strokeLinejoin="round"
        >
          I
        </text>
      </g>

      {/* GLACES Subtext Banner / Text */}
      <g filter="url(#shadow3d)">
        <text 
          x="250" 
          y="188" 
          textAnchor="middle" 
          fontFamily="Arial Black, sans-serif" 
          fontSize="38" 
          fontWeight="900" 
          letterSpacing="4" 
          fill="#FFFFFF" 
          stroke="#2A0F09" 
          strokeWidth="4" 
          strokeLinejoin="round"
        >
          GLACES
        </text>
      </g>
    </svg>
  );
};

export default ZahiLogo;
