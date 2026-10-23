import React, { useState } from 'react';
import {
  UserRole,
  OrganizerProfile,
  ThemeMode,
  UserProfile,
  Collaborator,
} from '../types/ticket';
import { TicketZapLogo } from './TicketZapLogo';
import { findAuthorizedCollaboratorByContact } from '../utils/ticketingLogic';
import {
  Crown,
  QrCode,
  User,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  KeyRound,
  Sun,
  Moon,
  Contrast,
  Mail,
  Phone,
  CheckCircle2,
  MapPin,
  Lock,
  Sparkles,
} from 'lucide-react';

interface AccessScreenProps {
  organizer: OrganizerProfile;
  currentUser: UserProfile;
  collaborators: Collaborator[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectPortal: (role: UserRole) => void;
  onCompleteRegistration: (profile: UserProfile, targetRole: UserRole) => void;
  onOpenEditProfile: () => void;
  onOpenAuthSession: () => void;
}

export const AccessScreen: React.FC<AccessScreenProps> = ({
  organizer,
  currentUser,
  collaborators,
  theme,
  onToggleTheme,
  onSelectPortal,
  onCompleteRegistration,
  onOpenEditProfile,
  onOpenAuthSession,
}) => {
  const [fullName, setFullName] = useState(
    currentUser.isRegistered ? currentUser.displayName : ''
  );
  const [email, setEmail] = useState(
    currentUser.isRegistered ? currentUser.email : ''
  );
  const [phone, setPhone] = useState(
    currentUser.isRegistered ? currentUser.phoneNumber || '' : ''
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    currentUser.role || 'user'
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Check in real time if the entered email or phone matches a Creator-authorized collaborator
  const matchedCollab = findAuthorizedCollaboratorByContact(
    collaborators,
    email,
    phone
  );

  const handleRegisterAndEnter = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || (!cleanEmail && !cleanPhone)) {
      setFormError(
        'Completa tu nombre y tu correo electrónico o teléfono para registrarte y ver los eventos.'
      );
      return;
    }

    setFormError(null);
    const resolvedRole: UserRole = matchedCollab ? 'collab' : selectedRole;

    const newProfile: UserProfile = {
      uid: currentUser.uid || `usr-${Date.now().toString().slice(-6)}`,
      displayName: matchedCollab ? matchedCollab.name : cleanName,
      email: cleanEmail || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@hypeticket.com`,
      phoneNumber: cleanPhone || '+52 744 000 0000',
      photoURL:
        matchedCollab?.avatar ||
        currentUser.photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      role: resolvedRole,
      company:
        resolvedRole === 'admin'
          ? organizer.name
          : matchedCollab
          ? `Staff Autorizado · ${matchedCollab.assignedGate}`
          : 'Miembro Verificado · Oleaje Beach Club',
      bio:
        resolvedRole === 'admin'
          ? 'Creador y Productor Oficial de Eventos'
          : resolvedRole === 'collab'
          ? `Colaborador de Escaneo QR (${matchedCollab?.assignedGate || 'Acceso Principal'})`
          : 'Asistente registrado con Cartera QR Individual',
      provider: 'email',
      isRegistered: true,
      createdAt: new Date().toISOString(),
    };

    onCompleteRegistration(newProfile, resolvedRole);
  };

  return (
    <div className="min-h-screen bg-grid flex flex-col justify-between p-4 sm:p-6 animate-in fade-in transition-colors relative pb-6">
      <div className="max-w-4xl mx-auto w-full my-auto py-4 space-y-6">
        {/* Top Exclusive Welcome & Venue Header */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase font-bold tracking-widest bg-emerald-500/15 text-emerald-300 px-3.5 py-1 rounded-full border border-emerald-500/30">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Oleaje Beach Club · Acapulco Diamante</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold space leading-tight text-white">
            Bienvenido a Hype Ticket
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-light max-w-xl mx-auto leading-relaxed">
            Boletera oficial de <strong className="text-white">{organizer.name}</strong>. Regístrate o inicia sesión para explorar los eventos que nuestros creadores cargan en tiempo real y acceder a tus códigos QR individuales por boleto.
          </p>
        </div>

        {/* MANDATORY REGISTRATION & LOGIN CARD */}
        <div className="liquid-blur p-5 sm:p-7 rounded-3xl border border-white/20 shadow-2xl max-w-xl mx-auto space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center font-bold shadow">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white space">
                  Registro Obligatorio de Acceso
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Identifícate para ver la cartelera de Oleaje Beach Club o validar boletos
                </p>
              </div>
            </div>
            <span className="text-[10px] mono bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full font-bold border border-amber-400/30">
              TIEMPO REAL
            </span>
          </div>

          {formError && (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
              {formError}
            </div>
          )}

          {matchedCollab && (
            <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
              <div>
                <span className="font-bold text-white">
                  ¡Colaborador Autorizado Detectado!
                </span>{' '}
                Tu contacto coincide con <strong>{matchedCollab.name}</strong> ({matchedCollab.assignedGate}). Al ingresar tendrás acceso directo al escáner QR en tiempo real.
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterAndEnter} className="space-y-3.5">
            <div>
              <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Valeria Cárdenas"
                  className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required={!phone.trim()}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                  Teléfono Móvil (WhatsApp / SMS) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                  <input
                    type="tel"
                    required={!email.trim()}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 744 123 4567"
                    className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white font-mono placeholder-neutral-500 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Role Selector during Registration */}
            <div>
              <label className="text-[11px] text-neutral-300 font-semibold block mb-1.5">
                Selecciona tu tipo de cuenta en la plataforma:
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('user')}
                  className={`p-2 sm:p-2.5 rounded-2xl border text-left transition cursor-pointer min-w-0 ${
                    selectedRole === 'user' && !matchedCollab
                      ? 'bg-white text-black border-white font-bold shadow-lg'
                      : 'bg-black/40 border-white/15 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[8px] sm:text-[9px] mono uppercase truncate">Público</span>
                  </div>
                  <div className="text-[11px] sm:text-xs font-extrabold mt-1 truncate">Asistente</div>
                  <div className="text-[9px] sm:text-[10px] opacity-75 leading-tight mt-0.5 line-clamp-2">
                    Ver eventos y mis QRs
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('collab')}
                  className={`p-2 sm:p-2.5 rounded-2xl border text-left transition cursor-pointer min-w-0 ${
                    selectedRole === 'collab' || Boolean(matchedCollab)
                      ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-lg'
                      : 'bg-black/40 border-white/15 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <QrCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[8px] sm:text-[9px] mono uppercase truncate">Staff</span>
                  </div>
                  <div className="text-[11px] sm:text-xs font-extrabold mt-1 truncate">Colaborador</div>
                  <div className="text-[9px] sm:text-[10px] opacity-75 leading-tight mt-0.5 line-clamp-2">
                    Solo escaneo QR
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-2 sm:p-2.5 rounded-2xl border text-left transition cursor-pointer min-w-0 ${
                    selectedRole === 'admin' && !matchedCollab
                      ? 'bg-emerald-400 text-black border-emerald-300 font-bold shadow-lg'
                      : 'bg-black/40 border-white/15 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <Crown className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[8px] sm:text-[9px] mono uppercase truncate">Productor</span>
                  </div>
                  <div className="text-[11px] sm:text-xs font-extrabold mt-1 truncate">Creador</div>
                  <div className="text-[9px] sm:text-[10px] opacity-75 leading-tight mt-0.5 line-clamp-2">
                    Subir eventos y staff
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer min-w-0"
            >
              <span className="truncate">Registrarme y Entrar a Oleaje</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </button>
          </form>

          {/* Alternative Firebase Google / Phone OTP Auth Button */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-400 text-center sm:text-left">
              ¿Prefieres autenticar con Google o código SMS?
            </span>
            <button
              type="button"
              onClick={onOpenAuthSession}
              className="w-full sm:w-auto px-4 py-2 rounded-xl liquid-glass-btn text-amber-300 border border-amber-400/35 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition min-w-0"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Google Sign-In / SMS OTP</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Access Cards for Testing Roles */}
        <div className="max-w-xl mx-auto space-y-2">
          <div className="text-center text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Accesos Directos por Rol (Oleaje Beach Club Acapulco)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Portal 1: Creador */}
            <button
              type="button"
              onClick={() => onSelectPortal('admin')}
              className="liquid-blur p-4 rounded-2xl border border-white/15 hover:border-emerald-400 text-left transition group cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <Crown className="w-5 h-5 text-emerald-400" />
                <span className="text-[9px] mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  CREADOR
                </span>
              </div>
              <div className="text-xs font-extrabold text-white group-hover:text-emerald-300">
                Panel de Creador
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Edita eventos en tiempo real, sube fotos/videos desde galería y autoriza colaboradores.
              </p>
            </button>

            {/* Portal 2: Colaborador */}
            <button
              type="button"
              onClick={() => onSelectPortal('collab')}
              className="liquid-blur p-4 rounded-2xl border border-white/15 hover:border-amber-400 text-left transition group cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <QrCode className="w-5 h-5 text-amber-400" />
                <span className="text-[9px] mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  SOLO QR
                </span>
              </div>
              <div className="text-xs font-extrabold text-white group-hover:text-amber-300">
                Terminal Colaborador
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Acceso exclusivo para escanear y registrar los QRs de boletos vendidos en tiempo real.
              </p>
            </button>

            {/* Portal 3: Asistente */}
            <button
              type="button"
              onClick={() => onSelectPortal('user')}
              className="liquid-blur p-4 rounded-2xl border border-white/15 hover:border-cyan-400 text-left transition group cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <User className="w-5 h-5 text-cyan-400" />
                <span className="text-[9px] mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                  PERFIL QR
                </span>
              </div>
              <div className="text-xs font-extrabold text-white group-hover:text-cyan-300">
                Cartelera & Mi Perfil QR
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Explora eventos en Acapulco, compra boletos y muestra tu QR individual por boleto.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Unified Floating Bottom Bar */}
      <div className="sticky bottom-3 z-40 mx-auto w-[calc(100%-0.5rem)] max-w-xl pt-2">
        <div className="liquid-blur rounded-3xl border border-white/20 px-3.5 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-2xl flex flex-wrap items-center justify-between gap-2">
          <div
            onClick={() => onSelectPortal('user')}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            <TicketZapLogo size="sm" />
            <div className="min-w-0">
              <div className="space text-xs sm:text-sm font-extrabold tracking-tight leading-none flex items-center gap-1.5 group-hover:text-emerald-400 transition">
                <span>HYPE</span>
                <span className="text-neutral-300 font-extrabold tracking-widest">TICKET</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-neutral-400 truncate mt-0.5 font-medium">
                Oleaje Beach Club · Acapulco Diamante
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={onOpenAuthSession}
              className="liquid-glass-btn px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-bold text-amber-300 border border-amber-400/35 flex items-center gap-1.5 cursor-pointer shadow-xl hover:scale-105 transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Cuenta</span>
            </button>

            <button
              type="button"
              onClick={onOpenEditProfile}
              className="liquid-glass-btn p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-[11px] font-semibold text-neutral-200 border border-white/20 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Productora</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              className="liquid-glass-btn p-1.5 rounded-full text-neutral-300 hover:text-white transition cursor-pointer"
            >
              {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-blue-400" />}
              {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
              {theme === 'bw' && <Contrast className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
