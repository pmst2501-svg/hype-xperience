import React from 'react';
import { TicketZapLogo } from './TicketZapLogo';

export const LogoLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-grid flex items-center justify-center animate-in fade-in duration-200 select-none">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-28 h-28 rounded-full bg-white/15 blur-2xl animate-pulse" />
        <TicketZapLogo
          size="xl"
          className="animate-pulse shadow-[0_0_45px_rgba(255,255,255,0.28)]"
        />
      </div>
    </div>
  );
};
