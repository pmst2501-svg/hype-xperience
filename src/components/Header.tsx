import React, { useState } from 'react';
import { UserRole, Collaborator, OrganizerProfile, UserProfile, ThemeMode } from '../types/ticket';
import { TicketZapLogo } from './TicketZapLogo';
import {
  Crown,
  QrCode,
  User,
  RefreshCw,
  ChevronDown,
  ShieldCheck,
  Building2,
  KeyRound,
  Sun,
  Moon,
  Contrast,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  collaborators: Collaborator[];
  activeStaffId: string;
  onSelectStaff: (staffId: string) => void;
  onResetData: () => void;
  organizer: OrganizerProfile;
  currentUser: UserProfile;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenAccessScreen: () => void;
  onOpenEditProfile: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  collaborators,
  activeStaffId,
  onSelectStaff,
  onResetData,
  organizer,
  currentUser,
  theme,
  onToggleTheme,
  onOpenAccessScreen,
  onOpenEditProfile,
  onOpenAuthModal,
}) => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const activeCollab = collaborators.find((c) => c.id === activeStaffId) || collaborators[0];

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'admin':
        return {
          title: `Creador · ${organizer.name}`,
          label: 'Admin / Productora',
          color: 'text-white bg-white/10 border-white/20',
          icon: Crown,
        };
      case 'collab':
        return {
          title: `Colaborador · ${activeCollab?.name || 'Staff'}`,
          label: 'Staff Entrada',
          color: 'text-neutral-200 bg-white/10 border-white/20',
          icon: QrCode,
        };
      case 'user':
        return {
          title: 'Asistente / Público General',
          label: 'Asistente',
          color: 'text-neutral-300 bg-white/10 border-white/20',
          icon: User,
        };
    }
  };

  const badge = getRoleBadge();
  const BadgeIcon = badge.icon;

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              onClick={onOpenAccessScreen}
              className="cursor-pointer"
              title="Ir a Pantalla de Accesos"
            >
              <TicketZapLogo size="sm" />
            </div>
            <div>
              <div className="space text-sm sm:text-base md:text-lg font-bold tracking-tight leading-none flex items-center gap-1.5 sm:gap-2">
                <span>HYPE</span>
                <span className="font-extrabold tracking-widest text-neutral-300">TICKET</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="truncate max-w-[150px] sm:max-w-none">Hype Xperience · {badge.label}</span>
              </div>
            </div>
          </div>

          {/* Quick actions & controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={`Modo: ${theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Monocromo'}`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl glass hover:bg-white/15 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
            >
              {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
              {theme === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
              {theme === 'bw' && <Contrast className="w-4 h-4 text-white" />}
            </button>

            {/* Key Button to open registration or login */}
            <button
              onClick={onOpenAuthModal}
              className="liquid-glass-btn p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-amber-300 border border-amber-400/30 transition flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105"
              title="Abrir Registro o Inicio de Sesión (Google, Teléfono, Email o Perfil)"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Acceso / Registro</span>
            </button>

            {/* Direct Access Screen Button */}
            <button
              onClick={onOpenAccessScreen}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl glass hover:bg-white/15 text-xs font-medium border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
              title="Abrir Pantalla de Accesos"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Portales</span>
            </button>

            {/* User Account / Profile Floating Chip */}
            <button
              onClick={onOpenAuthModal}
              className="liquid-glass-btn px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/25 transition cursor-pointer"
              title="Iniciar sesión o editar perfil"
            >
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-4 h-4 rounded-full object-cover border border-white/40"
              />
              <span className="hidden md:inline truncate max-w-[90px]">
                {currentUser.displayName.split(' ')[0]}
              </span>
              <span className="text-[10px] text-amber-300 hidden lg:inline">· Perfil</span>
            </button>

            {/* Role Switcher Badge Button (Opens role switch dialog) */}
            <button
              onClick={() => setShowRoleModal(true)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 cursor-pointer font-bold ${badge.color}`}
              title="Cambiar rol (Creador / Staff / Asistente)"
            >
              <BadgeIcon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{badge.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Reset prompt */}
            <button
              onClick={onResetData}
              title="Restablecer datos de prueba"
              aria-label="Restablecer datos de prueba"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl glass hover:bg-white/15 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="liquid-blur card-curved p-6 max-w-sm w-full border border-white/20 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Cambiar Tipo de Cuenta</span>
              </h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Selecciona el perfil de acceso para interactuar con la plataforma:
            </p>

            <div className="space-y-2">
              <button
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
                  <div className="text-sm font-bold">Creador ({organizer.name})</div>
                  <div className={`text-[11px] ${currentRole === 'admin' ? 'text-black/70' : 'text-neutral-400'}`}>
                    Dashboard, editar eventos, staff, emisión y auditoría antifraude
                  </div>
                </div>
              </button>

              <button
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
                  <div className="text-sm font-bold">Colaborador / Portero</div>
                  <div className={`text-[11px] ${currentRole === 'collab' ? 'text-black/70' : 'text-neutral-400'}`}>
                    Foto de brazalete, generar QR de verificación y escaneo
                  </div>
                </div>
              </button>

              <button
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
                  <div className="text-sm font-bold">Asistente / Público</div>
                  <div className={`text-[11px] ${currentRole === 'user' ? 'text-black/70' : 'text-neutral-400'}`}>
                    Video 9:16 "Evento de Hoy", explorar eventos y boletos
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  onOpenAuthModal();
                }}
                className="w-full py-2.5 rounded-xl liquid-glass-btn text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20"
              >
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span>Gestionar Cuenta / Perfil</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
