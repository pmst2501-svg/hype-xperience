import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Play,
  Smartphone,
  Maximize2,
  Minimize2,
  Music,
  QrCode,
} from 'lucide-react';

export type IPhoneColor = 'natural' | 'black' | 'white' | 'desert';
export type IPhoneViewMode = 'frame' | 'compact' | 'full';

interface IPhoneShellProps {
  children: React.ReactNode;
  activeEventTitle?: string;
  dynamicIslandNotification?: {
    title: string;
    subtitle: string;
    icon?: string;
    type?: 'ticket' | 'music' | 'info';
  } | null;
  onClearNotification?: () => void;
  onOpenStoryVideo?: () => void;
  onOpenScannerModal?: () => void;
}

export const IPhoneShell: React.FC<IPhoneShellProps> = ({
  children,
  activeEventTitle = 'Oleaje Beach Club Acapulco',
  dynamicIslandNotification,
  onClearNotification,
  onOpenStoryVideo,
  onOpenScannerModal,
}) => {
  const [viewMode, setViewMode] = useState<IPhoneViewMode>(() => {
    return (localStorage.getItem('hype_ticket_iphone_view_mode') as IPhoneViewMode) || 'frame';
  });

  const [chassisColor, setChassisColor] = useState<IPhoneColor>(() => {
    return (localStorage.getItem('hype_ticket_iphone_color') as IPhoneColor) || 'natural';
  });

  const [currentTime, setCurrentTime] = useState<string>('9:41');
  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState<boolean>(false);
  const [batteryLevel] = useState<number>(88);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (dynamicIslandNotification) {
      setIsDynamicIslandExpanded(true);
      const timer = setTimeout(() => {
        setIsDynamicIslandExpanded(false);
        if (onClearNotification) onClearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dynamicIslandNotification, onClearNotification]);

  const handleSetViewMode = (mode: IPhoneViewMode) => {
    setViewMode(mode);
    localStorage.setItem('hype_ticket_iphone_view_mode', mode);
  };

  const handleSetColor = (color: IPhoneColor) => {
    setChassisColor(color);
    localStorage.setItem('hype_ticket_iphone_color', color);
  };

  const chassisConfig = {
    natural: {
      name: 'Titanio Natural',
      outerBorder: 'border-[#5b5853]',
      innerBorder: 'border-[#383633]',
      outerBg: 'bg-[#2a2927]',
      accentBg: 'from-[#65625c] via-[#3d3b37] to-[#252422]',
      buttonBg: 'bg-[#4e4b46]',
      glow: 'shadow-[0_20px_80px_rgba(100,95,85,0.35)]',
    },
    black: {
      name: 'Titanio Negro',
      outerBorder: 'border-[#333336]',
      innerBorder: 'border-[#1e1e20]',
      outerBg: 'bg-[#151517]',
      accentBg: 'from-[#38383c] via-[#222225] to-[#121214]',
      buttonBg: 'bg-[#2c2c2f]',
      glow: 'shadow-[0_20px_80px_rgba(0,0,0,0.7)]',
    },
    white: {
      name: 'Titanio Blanco',
      outerBorder: 'border-[#c2c2c8]',
      innerBorder: 'border-[#94949c]',
      outerBg: 'bg-[#d6d6dc]',
      accentBg: 'from-[#f0f0f5] via-[#ceced4] to-[#a8a8b0]',
      buttonBg: 'bg-[#b8b8c0]',
      glow: 'shadow-[0_20px_80px_rgba(200,200,215,0.35)]',
    },
    desert: {
      name: 'Titanio Desierto',
      outerBorder: 'border-[#7a6452]',
      innerBorder: 'border-[#4e3f34]',
      outerBg: 'bg-[#3b3028]',
      accentBg: 'from-[#8e7561] via-[#564539] to-[#30261f]',
      buttonBg: 'bg-[#675445]',
      glow: 'shadow-[0_20px_80px_rgba(140,105,80,0.35)]',
    },
  }[chassisColor];

  return (
    <div className="min-h-screen flex flex-col bg-[#06070a] text-white">
      <div className="sticky top-0 z-50 bg-[#0d0e14]/90 backdrop-blur-xl border-b border-white/10 px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-neutral-800 to-neutral-600 flex items-center justify-center font-bold text-white text-xs border border-white/20 shadow">
            
          </div>
          <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
            <span>Hype Ticket · Oleaje Acapulco</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-neutral-300 font-mono">
              QR Live
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'frame' && (
            <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
              {(['natural', 'black', 'white', 'desert'] as IPhoneColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSetColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    c === 'natural'
                      ? 'bg-[#6b6761]'
                      : c === 'black'
                      ? 'bg-[#222225]'
                      : c === 'white'
                      ? 'bg-[#e4e4ea]'
                      : 'bg-[#856b56]'
                  } ${chassisColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-0.5 bg-black/40 rounded-lg p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => handleSetViewMode('frame')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'frame'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span className="hidden sm:inline">Marco iPhone</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('compact')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Minimize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Móvil Fluido</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('full')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'full'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Expandido</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 flex items-center justify-center p-0 ${
          viewMode === 'frame'
            ? 'py-4 sm:py-8 px-2 sm:px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#07080c] to-[#040406]'
            : viewMode === 'compact'
            ? 'py-2 sm:py-6 px-1 sm:px-4'
            : 'w-full'
        }`}
      >
        <div
          className={`relative transition-all duration-300 ${
            viewMode === 'frame'
              ? `w-full max-w-[430px] rounded-[56px] p-[10px] bg-gradient-to-b ${chassisConfig.accentBg} ${chassisConfig.glow} border-[3px] ${chassisConfig.outerBorder}`
              : viewMode === 'compact'
              ? 'w-full max-w-[440px] rounded-[44px] border border-white/15 overflow-hidden shadow-2xl'
              : 'w-full max-w-full'
          }`}
        >
          {viewMode === 'frame' && (
            <>
              <div
                onClick={onOpenScannerModal}
                title="Botón de Acción: Escáner QR en Tiempo Real"
                className={`absolute -left-[5px] top-[115px] w-[5px] h-[28px] ${chassisConfig.buttonBg} rounded-l-md cursor-pointer hover:w-[6px] transition-all`}
              />
              <div
                className={`absolute -left-[5px] top-[160px] w-[5px] h-[50px] ${chassisConfig.buttonBg} rounded-l-md`}
              />
              <div
                className={`absolute -left-[5px] top-[222px] w-[5px] h-[50px] ${chassisConfig.buttonBg} rounded-l-md`}
              />
              <div
                onClick={() => setIsDynamicIslandExpanded(!isDynamicIslandExpanded)}
                className={`absolute -right-[5px] top-[180px] w-[5px] h-[75px] ${chassisConfig.buttonBg} rounded-r-md cursor-pointer hover:w-[6px] transition-all`}
              />
            </>
          )}

          <div
            className={`relative w-full overflow-hidden bg-[#050508] text-white flex flex-col ${
              viewMode === 'frame'
                ? 'rounded-[46px] border-[3px] border-black shadow-inner min-h-[880px] max-h-[920px]'
                : viewMode === 'compact'
                ? 'rounded-[40px] min-h-[850px]'
                : 'min-h-screen'
            }`}
          >
            <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md px-5 pt-3 pb-2 flex items-center justify-between select-none relative">
              <div
                className={`w-14 text-left transition-opacity duration-200 ${
                  isDynamicIslandExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <span className="text-[13px] font-bold tracking-tight text-white font-mono">
                  {currentTime}
                </span>
              </div>

              <div className="flex-1 flex justify-center">
                <div
                  onClick={() => setIsDynamicIslandExpanded(!isDynamicIslandExpanded)}
                  className={`bg-black text-white rounded-full transition-all duration-300 cursor-pointer shadow-2xl border border-neutral-800 flex items-center justify-between overflow-hidden z-50 ${
                    isDynamicIslandExpanded
                      ? 'w-[94%] max-w-[360px] h-[82px] rounded-[32px] p-3 -mt-1'
                      : 'w-[126px] h-[30px] px-2.5'
                  }`}
                >
                  {!isDynamicIslandExpanded ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-medium tracking-tight text-neutral-300 max-w-[50px] truncate">
                          QR Live
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#111116] border border-[#22222a] flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-[#1e2338]" />
                        </div>
                        <div className="flex items-center gap-0.5 h-2.5">
                          <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                          <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                          <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
                          <Music className="w-5 h-5 text-black" />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1 truncate">
                            <span className="truncate">
                              {dynamicIslandNotification?.title || activeEventTitle}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                          </div>
                          <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 truncate">
                            <span className="truncate">
                              {dynamicIslandNotification?.subtitle || 'Oleaje Beach Club • Acapulco'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {onOpenStoryVideo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStoryVideo();
                            }}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                            title="Ver Video 9:16"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        {onOpenScannerModal && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenScannerModal();
                            }}
                            className="p-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition cursor-pointer"
                            title="Abrir Escáner QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`w-14 flex items-center justify-end gap-1.5 text-neutral-200 transition-opacity duration-200 ${
                  isDynamicIslandExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <span className="text-[10px] font-bold font-mono">5G</span>
                <Wifi className="w-3.5 h-3.5" />
                <div className="flex items-center gap-0.5">
                  <div className="relative w-5 h-2.5 rounded-[4px] border border-neutral-300 p-0.5 flex items-center">
                    <div
                      className="h-full bg-white rounded-[2px]"
                      style={{ width: `${batteryLevel}%` }}
                    />
                  </div>
                  <div className="w-0.5 h-1 bg-neutral-300 rounded-r-sm" />
                </div>
              </div>
            </div>

            <div
              className={`@container flex-1 overflow-y-auto overflow-x-hidden ${
                viewMode === 'frame' ? 'pb-8' : 'pb-6'
              }`}
            >
              {children}
            </div>

            <div className="sticky bottom-0 z-40 bg-black/60 backdrop-blur-md pt-2 pb-2.5 flex items-center justify-center pointer-events-auto">
              <div
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-36 h-1.5 bg-white/50 hover:bg-white/80 active:scale-95 transition-all rounded-full cursor-pointer shadow"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
