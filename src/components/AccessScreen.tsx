import React from 'react';
import { UserRole, OrganizerProfile, ThemeMode } from '../types/ticket';
import { TicketZapLogo } from './TicketZapLogo';
import {
  Crown,
  QrCode,
  User,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  Sparkles,
  KeyRound,
  Sun,
  Moon,
  Contrast,
  LogIn,
} from 'lucide-react';

interface AccessScreenProps {
  organizer: OrganizerProfile;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectPortal: (role: UserRole) => void;
  onOpenEditProfile: () => void;
  onOpenAuthSession: () => void;
}

export const AccessScreen: React.FC<AccessScreenProps> = ({
  organizer,
  theme,
  onToggleTheme,
  onSelectPortal,
  onOpenEditProfile,
  onOpenAuthSession,
}) => {
  return (
    <div className="min-h-screen bg-grid flex flex-col justify-between p-4 sm:p-8 animate-in fade-in transition-colors relative pb-24">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <div
          onClick={() => onSelectPortal('admin')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Entrar al Portal Principal"
        >
          <TicketZapLogo size="md" />
          <div>
            <div className="space text-base sm:text-lg font-extrabold tracking-tight leading-none flex items-center gap-2 group-hover:text-emerald-400 transition">
              <span>HYPE</span>
              <span className="text-neutral-400 font-extrabold tracking-widest">TICKET</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 font-medium">
              Todos los derechos reservados para Hype Xperience
            </div>
          </div>
        </div>

        {/* Header Key & Enter Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectPortal('admin')}
            className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-lg hover:scale-105 transition"
            title="Entrar Directo al Portal"
          >
            <span>Entrar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenAuthSession}
            className="liquid-glass-btn px-3 py-1.5 rounded-full text-xs font-bold text-amber-300 border border-amber-400/30 flex items-center gap-1.5 cursor-pointer shadow-lg hover:scale-105 transition"
            title="Abrir Acceso & Registro de Sesión"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Acceso / Registro</span>
          </button>
        </div>
      </div>

      {/* Main Access Options */}
      <div className="max-w-5xl mx-auto w-full my-auto py-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase font-bold tracking-widest bg-white/10 px-3.5 py-1 rounded-full border border-white/20">
            Pantalla de Accesos Oficiales
          </span>
          <h1 className="text-3xl sm:text-5xl font-extralight space leading-tight">
            Selecciona tu Perfil de Ingreso
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-light">
            Bienvenido a la plataforma de <strong className="text-white">{organizer.name}</strong>. Elige el modo de interacción para continuar:
          </p>
        </div>

        {/* 3 Main Portal Cards (Liquid glass floating feel) */}
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {/* Portal 1: Creador del Evento */}
          <div
            onClick={() => onSelectPortal('admin')}
            className="liquid-blur p-6 rounded-3xl border border-white/20 hover:border-white cursor-pointer transition-all duration-300 group shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition font-bold">
                  <Crown className="w-6 h-6" />
                </div>
                <span className="text-[10px] mono bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold border border-emerald-500/30">
                  CREADOR
                </span>
              </div>

              <div>
                <div className="text-xs font-mono uppercase font-bold text-neutral-400">
                  {organizer.name}
                </div>
                <h3 className="text-xl font-extrabold mt-1 group-hover:text-emerald-400 transition">
                  Panel de Organizador
                </h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Gestión total de eventos, emisión de boletos, administración de colaboradores, auditoría de brazaletes en vivo y finanzas.
                </p>
              </div>
            </div>

            <button className="w-full py-3 rounded-full bg-white text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl group-hover:translate-x-0.5 transition cursor-pointer">
              <span>Ingresar como Creador</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 2: Colaborador / Terminal Staff */}
          <div
            onClick={() => onSelectPortal('collab')}
            className="liquid-blur p-6 rounded-3xl border border-white/20 hover:border-white cursor-pointer transition-all duration-300 group shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition font-bold">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="text-[10px] mono bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full font-bold border border-amber-400/30">
                  ACCESO PUERTA
                </span>
              </div>

              <div>
                <div className="text-xs font-mono uppercase font-bold text-neutral-400">
                  Staff & Portería
                </div>
                <h3 className="text-xl font-extrabold mt-1 group-hover:text-amber-400 transition">
                  Terminal de Colaborador
                </h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Módulo optimizado para trabajadores en puerta. Toma foto del brazalete físico, ejecuta pruebas de cliente aleatorio y genera QR antifraude.
                </p>
              </div>
            </div>

            <button className="w-full py-3 rounded-full bg-white text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl group-hover:translate-x-0.5 transition cursor-pointer">
              <span>Ingresar como Staff</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 3: Asistente / Público General */}
          <div
            onClick={() => onSelectPortal('user')}
            className="liquid-blur p-6 rounded-3xl border border-white/20 hover:border-white cursor-pointer transition-all duration-300 group shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition font-bold">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-[10px] mono bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full font-bold border border-blue-500/30">
                  PÚBLICO
                </span>
              </div>

              <div>
                <div className="text-xs font-mono uppercase font-bold text-neutral-400">
                  Asistente
                </div>
                <h3 className="text-xl font-extrabold mt-1 group-hover:text-blue-400 transition">
                  Cartelera & Boletos
                </h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Explora la cartelera de eventos de la productora, compra entradas, mira la Historia 9:16 de hoy y revisa tu cartera QR.
                </p>
              </div>
            </div>

            <button className="w-full py-3 rounded-full bg-white text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl group-hover:translate-x-0.5 transition cursor-pointer">
              <span>Ver Cartelera de Eventos</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Organizer Banner Footer Card */}
        <div className="liquid-blur p-5 rounded-3xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/30 shadow-xl flex-shrink-0 mx-auto sm:mx-0">
              <img
                src={organizer.avatar}
                alt={organizer.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <span className="text-xs font-bold text-white">{organizer.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-1">{organizer.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAuthSession}
              className="px-4 py-2 rounded-xl liquid-glass-btn text-white text-xs font-semibold border border-white/20 transition cursor-pointer"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onOpenEditProfile}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition cursor-pointer whitespace-nowrap"
            >
              Editar Perfil Productora
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Bar at the Bottom */}
      <div className="sticky bottom-3 z-40 mx-auto max-w-fit px-2 pt-2">
        <div className="floating-dock flex items-center gap-2 shadow-2xl">
          {/* Key Button to open registration or login */}
          <button
            onClick={onOpenAuthSession}
            className="liquid-glass-btn px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold text-amber-300 border border-amber-400/30 flex items-center gap-2 cursor-pointer shadow-xl hover:scale-105 transition"
            title="Abrir Acceso & Registro de Sesión (Google, Teléfono, Email o Perfil)"
          >
            <KeyRound className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Acceso / Registro</span>
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-white/15 mx-0.5" />

          {/* Producer Profile button */}
          <button
            onClick={onOpenEditProfile}
            className="liquid-glass-btn px-3 py-2 rounded-full text-xs font-semibold text-neutral-200 border border-white/20 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            title="Editar Perfil de la Productora"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Perfil Productora</span>
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-white/15 mx-0.5" />

          {/* Theme switcher */}
          <button
            onClick={onToggleTheme}
            title={`Tema: ${theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Monocromo'}`}
            className="liquid-glass-btn p-2 rounded-full text-neutral-300 hover:text-white transition cursor-pointer"
          >
            {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-blue-400" />}
            {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
            {theme === 'bw' && <Contrast className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </div>

      <div className="text-center text-[10px] text-neutral-500 font-mono py-2">
        Todos los derechos reservados para Hype Xperience © 2026 · {organizer.name}
      </div>
    </div>
  );
};
