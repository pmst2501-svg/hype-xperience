import React from 'react';
import { UserRole, ThemeMode, UserProfile } from '../types/ticket';
import {
  Camera,
  Sun,
  Moon,
  Contrast,
  User,
  Shield,
  Play,
  KeyRound,
  Zap,
} from 'lucide-react';

interface FloatingDockProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  currentUser: UserProfile;
  onOpenAuthSession: () => void;
  onOpenWristbandTest: () => void;
  onOpenStoryVideo: () => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  currentRole,
  onSelectRole,
  theme,
  onToggleTheme,
  currentUser,
  onOpenAuthSession,
  onOpenWristbandTest,
  onOpenStoryVideo,
}) => {
  return (
    <div className="floating-dock flex items-center gap-1 sm:gap-2 max-w-[95vw] shadow-2xl">
      {/* 1. Quick Test Wristband Button */}
      <button
        type="button"
        onClick={onOpenWristbandTest}
        title="Prueba de Función: Foto Brazalete + Cliente Aleatorio"
        className="liquid-glass-btn px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 cursor-pointer shadow-lg"
      >
        <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="hidden xs:inline">Prueba Brazalete</span>
      </button>

      {/* Divider */}
      <div className="h-5 w-px bg-white/15 mx-0.5" />

      {/* 2. Role Selector Quick Toggle */}
      <div className="flex items-center gap-0.5 bg-black/30 rounded-full p-0.5 border border-white/10">
        <button
          type="button"
          onClick={() => onSelectRole('admin')}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
            currentRole === 'admin'
              ? 'bg-white text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Vista Creador Bush Brothers"
        >
          Creador
        </button>
        <button
          type="button"
          onClick={() => onSelectRole('collab')}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
            currentRole === 'collab'
              ? 'bg-white text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Vista Staff Entrada"
        >
          Staff
        </button>
        <button
          type="button"
          onClick={() => onSelectRole('user')}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
            currentRole === 'user'
              ? 'bg-white text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Vista Asistente Boletera"
        >
          Asistente
        </button>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-white/15 mx-0.5" />

      {/* 3. Story 9:16 Button */}
      <button
        type="button"
        onClick={onOpenStoryVideo}
        title="Ver Historia 9:16 de Hoy"
        className="liquid-glass-btn p-2 rounded-full text-white hover:text-amber-300 cursor-pointer"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
      </button>

      {/* 4. Key Button: Auth, Registration & Login */}
      <button
        type="button"
        onClick={onOpenAuthSession}
        title="Acceso de Registro o Inicio de Sesión (Google, Teléfono, Email o Perfil)"
        className="liquid-glass-btn p-2 rounded-full text-amber-300 hover:text-amber-200 cursor-pointer border border-amber-400/30"
      >
        <KeyRound className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      </button>

      {/* 5. User Profile Button */}
      <button
        type="button"
        onClick={onOpenAuthSession}
        title={`Sesión & Perfil (${currentUser.displayName})`}
        className="liquid-glass-btn p-1.5 sm:px-2.5 sm:py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer text-xs font-medium border border-white/20"
      >
        <img
          src={currentUser.photoURL}
          alt={currentUser.displayName}
          className="w-5 h-5 rounded-full object-cover border border-white/40"
        />
        <span className="hidden md:inline text-[11px] font-bold text-white max-w-[80px] truncate">
          {currentUser.displayName.split(' ')[0]}
        </span>
      </button>

      {/* 5. Theme Toggle (Dark / Light / B&W) */}
      <button
        type="button"
        onClick={onToggleTheme}
        title={`Cambiar Tema (Actual: ${theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Monocromo'})`}
        className="liquid-glass-btn p-2 rounded-full text-neutral-300 hover:text-white cursor-pointer"
      >
        {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-blue-400" />}
        {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
        {theme === 'bw' && <Contrast className="w-3.5 h-3.5 text-white" />}
      </button>
    </div>
  );
};
