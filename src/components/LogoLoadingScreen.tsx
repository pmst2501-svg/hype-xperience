import React from 'react';
import { TicketZapLogo } from './TicketZapLogo';

export const LogoLoadingScreen: React.FC = () => {
  return (
    <div
      data-testid="logo-loading-screen"
      className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#050507] bg-grid flex flex-col items-center justify-center overflow-hidden select-none m-0 p-0"
    >
      <div className="relative flex items-center justify-center m-auto">
        <div className="absolute w-32 h-32 rounded-full bg-white/15 blur-2xl animate-pulse pointer-events-none" />
        <TicketZapLogo
          size="xl"
          className="animate-pulse shadow-[0_0_45px_rgba(255,255,255,0.28)]"
        />
      </div>
    </div>
  );
};
