'use client';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ className = '', size = 'md', showText = false }: LogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`${sizes[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Grunge texture filter */}
            <filter id="grunge">
              <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.5" />
            </filter>
            {/* Noise texture for distressed effect */}
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
              <feComposite operator="in" in="noise" in2="SourceAlpha" />
            </filter>
          </defs>

          {/* Square outline with corner breaks */}
          <g className="text-gray-900 dark:text-white">
            {/* Top-left corner break */}
            <path
              d="M 20 20 L 20 30 M 20 20 L 30 20"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Top-right corner break */}
            <path
              d="M 100 20 L 100 30 M 100 20 L 90 20"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Bottom-left corner break */}
            <path
              d="M 20 100 L 20 90 M 20 100 L 30 100"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Bottom-right corner break */}
            <path
              d="M 100 100 L 100 90 M 100 100 L 90 100"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Square outline (with breaks at corners) */}
            <path
              d="M 30 20 L 90 20 M 100 30 L 100 90 M 90 100 L 30 100 M 20 90 L 20 30"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Stylized X */}
            <path
              d="M 35 35 L 85 85"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 85 35 L 35 85"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </svg>
      </div>
      
      {showText && (
        <div className={`${textSizes[size]} font-bold uppercase tracking-wider mt-2 text-gray-900 dark:text-white`}>
          <span className="font-black">XPT</span>
          <span className="mx-1.5 font-semibold">MARKETS</span>
        </div>
      )}
    </div>
  );
}
