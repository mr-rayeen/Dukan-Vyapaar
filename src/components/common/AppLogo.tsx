import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-9 h-9', size = 36 }) => {
  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-xs flex items-center justify-center shrink-0 select-none bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 p-[1.5px] ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glossy inner container */}
      <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-emerald-500 to-teal-700 flex items-center justify-center relative overflow-hidden">
        {/* Subtle top light highlight */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

        {/* Scalable SVG Icon: Modern Isometric Box with rupee bill & ladi indicator */}
        <svg
          viewBox="0 0 100 100"
          className="w-[78%] h-[78%] drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Isometric Box / Carton */}
          {/* Top Face */}
          <polygon
            points="50,16 78,31 50,45 22,31"
            fill="#FDE68A"
          />
          {/* Left Face */}
          <polygon
            points="22,31 50,45 50,75 22,60"
            fill="#F59E0B"
          />
          {/* Right Face */}
          <polygon
            points="50,45 78,31 78,60 50,75"
            fill="#D97706"
          />
          {/* Box Seam / Center Tape */}
          <polygon
            points="50,16 50,45 54,43 54,18"
            fill="#B45309"
            opacity="0.35"
          />

          {/* Golden Rupee / Bill Badge overlay bottom right */}
          <circle cx="72" cy="72" r="19" fill="#FFFFFF" />
          <circle cx="72" cy="72" r="16.5" fill="#10B981" />
          <text
            x="72"
            y="78"
            fontSize="18"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            ₹
          </text>
        </svg>
      </div>
    </div>
  );
};
