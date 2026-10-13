import React from 'react';

interface ZahiLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
}

export const ZahiLogo: React.FC<ZahiLogoProps> = ({ 
  className = "h-10 w-auto", 
  width, 
  height,
  alt = "Zahi Glaces"
}) => {
  return (
    <img 
      src="/zahi-logo.png" 
      alt={alt}
      className={`object-contain ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined
      }}
    />
  );
};

export default ZahiLogo;
