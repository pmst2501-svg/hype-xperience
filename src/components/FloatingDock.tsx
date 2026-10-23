import React, { useState } from 'react';
import { UserRole, ThemeMode, UserProfile, OrganizerProfile, Collaborator } from '../types/ticket';
import { TicketZapLogo } from './TicketZapLogo';
import {
  Sun,
  Moon,
  Contrast,
  User,
  Play,
  KeyRound,
  Crown,
  QrCode,
  ShieldCheck,
  RefreshCw,
  ChevronUp,
} from 'lucide-react';

interface FloatingDockProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  currentUser: UserProfile;
  organizer?: OrganizerProfile;
  collaborators?: Collaborator[];
  activeStaffId?: string;
  onOpenAuthSession: () => void;
  onOpenScannerModal: () => void;
  onOpenStoryVideo: () => void;
  onOpenAccessScreen?: () => void;
  onResetData?: () => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  currentRole,
  onSelectRole,
  theme,
  onToggleTheme,
  currentUser,
  organizer,
  onOpenAuthSession,
  onOpenScannerModal,
  onOpenStoryVideo,
  onOpenAccessScreen,
  onResetData,
}) => {
  const [showRoleModal, setShowRoleModal] = useState(false);

  return (
    <>
      <div className="sticky bottom-3 z-45 mx-auto w-[calc(100%-1rem)] max-w-xl px-1 pb-[env(safe-area-inset-bottom)]">
        <div className="liquid-blur rounded-3xl border border-white/20 px-3 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-2xl space-y-2">
          {/* Top Unified Row: Brand Identity + Key Auth + Profile + Theme */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            {/* Logo & HYPE TICKET Brand */}
            <div
              onClick={onOpenAccessScreen}
              className="flex items-center gap-2 cursor-pointer group min-w-0 flex-1"
              title="Hype Xperience · Oleaje Beach Club Acapulco"
            >
              <TicketZapLogo size="sm" />
              <div className="min-w-0 flex-1">
                <div className="space text-xs sm:text-sm font-extrabold tracking-tight leading-none flex items-center gap-1 truncate">
                  <span>HYPE</span>
                  <span className="font-extrabold tracking-widest text-neutral-300">TICKET</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-neutral-400 truncate mt-0.5 font-medium">
                  Oleaje Beach Club · Acapulco
                </div>
              </div>
            </div>

            {/* Unified Right Controls: Key Button, User Profile, Portals, Theme, Reset */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={onOpenAuthSession}
                title="Registro o Inicio de Sesión"
                className="liquid-glass-btn px-2.5 py-1.5 rounded-full text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer border border-amber-400/35 flex items-center gap-1 shadow-md min-w-0"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline truncate">Acceso</span>
              </button>

              <button
                type="button"
                onClick={onOpenAuthSession}
                title={`Perfil (${currentUser.displayName})`}
                className="liquid-glass-btn p-1 sm:px-2 sm:py-1 rounded-full flex items-center gap-1.5 cursor-pointer text-xs font-medium border border-white/20 min-w-0"
              >
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-5 h-5 rounded-full object-cover border border-white/40 shrink-0"
                />
                <span className="hidden md:inline text-[11px] font-bold text-white max-w-[70px] truncate">
                  {currentUser.displayName.split(' ')[0]}
                </span>
              </button>

              {onOpenAccessScreen && (
                <button
                  type="button"
                  onClick={onOpenAccessScreen}
                  title="Pantalla de Bienvenida y Registro"
                  className="liquid-glass-btn p-1.5 rounded-full text-emerald-400 hover:text-emerald-300 cursor-pointer border border-white/15 shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={onToggleTheme}
                title={`Cambiar Tema (Actual: ${theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Monocromo'})`}
                className="liquid-glass-btn p-1.5 rounded-full text-neutral-300 hover:text-white cursor-pointer shrink-0"
              >
                {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-blue-400" />}
                {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                {theme === 'bw' && <Contrast className="w-3.5 h-3.5 text-white" />}
              </button>

              {onResetData && (
                <button
                  type="button"
                  onClick={onResetData}
                  title="Restablecer datos"
                  aria-label="Restablecer datos"
                  className="liquid-glass-btn p-1.5 rounded-full text-neutral-400 hover:text-white cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Unified Row: Role Switcher + QR Scanner + 9:16 Story */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-0.5 bg-black/35 rounded-full p-0.5 border border-white/10 min-w-0">
              <button
                type="button"
                onClick={() => onSelectRole('admin')}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-full transition-all cursor-pointer truncate ${
                  currentRole === 'admin'
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Creador
              </button>
              <button
                type="button"
                onClick={() => onSelectRole('collab')}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-full transition-all cursor-pointer truncate ${
                  currentRole === 'collab'
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Staff QR
              </button>
              <button
                type="button"
                onClick={() => onSelectRole('user')}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-full transition-all cursor-pointer truncate ${
                  currentRole === 'user'
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Asistente
              </button>
              <button
                type="button"
                onClick={() => setShowRoleModal(true)}
                className="p-1 text-neutral-400 hover:text-white transition cursor-pointer shrink-0"
                title="Detalles de Rol"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onOpenScannerModal}
                title="Escáner QR de Boletos en Tiempo Real"
                className="liquid-glass-btn px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 cursor-pointer shadow-lg"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">QR</span>
              </button>

              <button
                type="button"
                onClick={onOpenStoryVideo}
                title="Ver Historia 9:16 de Hoy"
                className="liquid-glass-btn p-1.5 rounded-full text-white hover:text-amber-300 cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="liquid-blur card-curved p-6 max-w-sm w-full border border-white/20 shadow-2xl space-y-4 text-white rounded-3xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Cambiar Vista de Perfil</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onSelectRole('admin');
                  setShowRoleModal(false);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  currentRole === 'admin'
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentRole === 'admin' ? 'bg-black text-white' : 'bg-white/10 text-white'}`}>
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Creador ({organizer?.name || 'Hype Ticket'})</div>
                  <div className={`text-[11px] ${currentRole === 'admin' ? 'text-black/70' : 'text-neutral-400'}`}>
                    Edición en vivo, carga de fotos/videos multimedia y colaboradores
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectRole('collab');
                  setShowRoleModal(false);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  currentRole === 'collab'
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentRole === 'collab' ? 'bg-black text-white' : 'bg-white/10 text-white'}`}>
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Colaborador / Acceso QR</div>
                  <div className={`text-[11px] ${currentRole === 'collab' ? 'text-black/70' : 'text-neutral-400'}`}>
                    Acceso exclusivo para registrar y validar QRs vendidos en tiempo real
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectRole('user');
                  setShowRoleModal(false);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  currentRole === 'user'
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentRole === 'user' ? 'bg-black text-white' : 'bg-white/10 text-white'}`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Asistente / Perfil QR</div>
                  <div className={`text-[11px] ${currentRole === 'user' ? 'text-black/70' : 'text-neutral-400'}`}>
                    Ver eventos de creadores y mostrar QR individual por boleto
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
