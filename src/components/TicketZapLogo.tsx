import React from 'react';

interface TicketZapLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const TicketZapLogo: React.FC<TicketZapLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-11 h-11',
  }[size];

  return (
    <div
      className={`relative ${sizeClasses} bg-white text-black flex items-center justify-center font-black shadow-xl shadow-white/10 flex-shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
      title="Hype Xperience Ticket"
    >
      {/* Ticket SVG with side cutouts and a vibrant lightning bolt in the center */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${iconSizes} text-black`}
      >
        {/* Ticket body with classic notched edges */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3 6.5C3 5.11929 4.11929 4 5.5 4H18.5C19.8807 4 21 5.11929 21 6.5V9C19.8954 9 19 9.89543 19 11C19 12.1046 19.8954 13 21 13V17.5C21 18.8807 19.8807 20 18.5 20H5.5C4.11929 20 3 18.8807 3 17.5V13C4.10457 13 5 12.1046 5 11C5 9.89543 4.10457 9 3 9V6.5ZM13.5 6L8.5 12.5H12L10.5 18L15.5 11.5H12L13.5 6Z"
        />
      </svg>
    </div>
  );
};
