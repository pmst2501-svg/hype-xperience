import React, { useState, useRef } from 'react';
import {
  UserRole,
  OrganizerProfile,
  ThemeMode,
  UserProfile,
  Collaborator,
} from '../types/ticket';
import { TicketZapLogo } from './TicketZapLogo';
import {
  buildRegistrationFromZero,
  authenticateRegisteredUser,
  findAuthorizedCollaboratorByContact,
} from '../utils/ticketingLogic';
import { processUploadedImageFile } from '../utils/mediaHelper';
import {
  Crown,
  QrCode,
  User,
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
  Camera,
  Upload,
  CreditCard,
  FileText,
  DoorOpen,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';

interface AccessScreenProps {
  organizer: OrganizerProfile;
  currentUser: UserProfile;
  registeredUsers: UserProfile[];
  collaborators: Collaborator[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectPortal: (role: UserRole) => void;
  onCompleteRegistration: (
    profile: UserProfile,
    targetRole: UserRole,
    rawPassword?: string,
    newOrganizer?: OrganizerProfile,
    newCollaborator?: Collaborator
  ) => void;
  onSwitchRegisteredUser: (user: UserProfile) => void;
  onOpenEditProfile: () => void;
  onOpenAuthSession: () => void;
}

export const AccessScreen: React.FC<AccessScreenProps> = ({
  organizer,
  currentUser,
  registeredUsers,
  collaborators,
  theme,
  onToggleTheme,
  onSelectPortal,
  onCompleteRegistration,
  onSwitchRegisteredUser,
  onOpenEditProfile,
  onOpenAuthSession,
}) => {
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);

  // Common registration fields from zero
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  // Producer / Organization specific fields
  const [organizationName, setOrganizationName] = useState(organizer.name || '');
  const [taxId, setTaxId] = useState('');
  const [city, setCity] = useState('Acapulco Diamante, Gro.');
  const [instagram, setInstagram] = useState('');
  const [stripeAccountEmail, setStripeAccountEmail] = useState('');
  const [bio, setBio] = useState('');

  // Staff / Worker specific fields
  const [staffRoleTitle, setStaffRoleTitle] = useState(
    'Staff Verificación QR · Acceso Principal'
  );
  const [assignedGate, setAssignedGate] = useState('Acceso Principal Costera');
  const [pin, setPin] = useState('1234');

  // Buyer specific fields
  const [documentId, setDocumentId] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if entered email/phone matches an already-authorized collaborator created by Producer
  const matchedCollab = findAuthorizedCollaboratorByContact(
    collaborators,
    email,
    phone
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processUploadedImageFile(file);
      setPhotoURL(compressed);
      setPhotoFileName(file.name);
    } catch {
      setFormError('No se pudo procesar la foto seleccionada.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const targetRole: UserRole = matchedCollab ? 'collab' : selectedRole;

    const result = buildRegistrationFromZero({
      role: targetRole,
      displayName,
      email,
      password,
      phoneNumber: phone,
      photoURL: photoURL || matchedCollab?.avatar,
      organizationName:
        targetRole === 'admin'
          ? organizationName
          : organizer.name || organizationName || 'Productora Oficial',
      taxId,
      city,
      instagram,
      stripeAccountEmail: stripeAccountEmail || email,
      bio,
      assignedGate: matchedCollab?.assignedGate || assignedGate,
      staffRoleTitle: matchedCollab?.roleTitle || staffRoleTitle,
      pin: matchedCollab?.pin || pin,
      documentId,
    });

    if (!result.valid || !result.userProfile) {
      setFormError(result.error || 'Verifica los campos obligatorios.');
      return;
    }

    onCompleteRegistration(
      result.userProfile,
      targetRole,
      password,
      result.organizerProfile,
      matchedCollab ? undefined : result.collaboratorProfile
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const authRes = authenticateRegisteredUser(
      registeredUsers,
      collaborators,
      loginEmail,
      loginPassword
    );
    if (!authRes.success || !authRes.user) {
      setFormError(
        authRes.error || 'Credenciales inválidas. Verifica tu correo y contraseña.'
      );
      return;
    }
    onSwitchRegisteredUser(authRes.user);
  };

  const previewAvatar =
    photoURL ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      (selectedRole === 'admin' ? organizationName : displayName) || 'HT'
    )}`;

  return (
    <div className="min-h-screen bg-grid flex flex-col justify-between p-3 sm:p-6 animate-in fade-in transition-colors relative pb-6">
      <div className="max-w-4xl mx-auto w-full my-auto py-3 space-y-5">
        {/* Top Exclusive Welcome & Venue Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase font-bold tracking-widest bg-emerald-500/15 text-emerald-300 px-3.5 py-1 rounded-full border border-emerald-500/30">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Oleaje Beach Club · Acapulco Diamante · Pagos Stripe</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold space leading-tight text-white">
            Registro Oficial de Perfiles desde Cero
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-light max-w-xl mx-auto leading-relaxed">
            Plataforma limpia sin cuentas demo. Todo lo que registres a partir de ahora (Productora de Eventos, Próximo Evento, Cuenta de Trabajador/Staff y Usuario Comprador con Stripe) se conserva de forma permanente.
          </p>
        </div>

        {/* Registered Accounts Switcher (Only shows accounts created from zero by the user) */}
        {registeredUsers.length > 0 && (
          <div className="liquid-blur p-4 rounded-3xl border border-emerald-500/30 max-w-2xl mx-auto space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Mis Cuentas Registradas ({registeredUsers.length}) · Cambio Rápido de Sesión:
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                PERSISTENCIA ACTIVA
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {registeredUsers.map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => onSwitchRegisteredUser(u)}
                  className="p-2.5 rounded-2xl bg-black/50 hover:bg-white/15 border border-white/15 hover:border-emerald-400 text-left flex items-center gap-2.5 transition cursor-pointer min-w-0"
                >
                  <img
                    src={u.photoURL}
                    alt={u.displayName}
                    className="w-9 h-9 rounded-xl object-cover border border-white/25 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        {u.role === 'admin'
                          ? 'Productora'
                          : u.role === 'collab'
                          ? 'Staff QR'
                          : 'Comprador'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate mt-0.5">
                      {u.role === 'admin' && u.company ? u.company : u.displayName}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {u.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MAIN ONBOARDING & LOGIN CARD */}
        <div className="liquid-blur p-5 sm:p-7 rounded-3xl border border-white/20 shadow-2xl max-w-2xl mx-auto space-y-5 relative overflow-hidden">
          {/* Mode Switcher: Crear Cuenta desde 0 vs Iniciar Sesión */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setFormError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                authTab === 'register'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span className="truncate">Crear Cuenta desde 0</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setFormError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                authTab === 'login'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Iniciar Sesión ({registeredUsers.length})
              </span>
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium">
              {formSuccess}
            </div>
          )}

          {authTab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Step 1: Select Profile Role to Register from Zero */}
              <div>
                <label className="text-[11px] text-neutral-300 font-bold uppercase tracking-wider mono block mb-2">
                  1. Elige el tipo de perfil que vas a registrar:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer min-w-0 ${
                      selectedRole === 'admin'
                        ? 'bg-emerald-400 text-black border-emerald-300 font-bold shadow-lg'
                        : 'bg-black/40 border-white/15 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <Crown className="w-4 h-4 shrink-0" />
                      <span className="text-[9px] mono uppercase font-bold">
                        Paso 1
                      </span>
                    </div>
                    <div className="text-xs font-extrabold mt-1 truncate">
                      1. Creador / Productora
                    </div>
                    <div className="text-[10px] opacity-80 leading-tight mt-0.5">
                      Registra tu organización, eventos, staff y cobros Stripe
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('collab')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer min-w-0 ${
                      selectedRole === 'collab'
                        ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-lg'
                        : 'bg-black/40 border-white/15 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span className="text-[9px] mono uppercase font-bold">
                        Paso 2
                      </span>
                    </div>
                    <div className="text-xs font-extrabold mt-1 truncate">
                      2. Staff / Trabajador
                    </div>
                    <div className="text-[10px] opacity-80 leading-tight mt-0.5">
                      Cuenta operativa para escaneo de boletos QR en puerta
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('user')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer min-w-0 ${
                      selectedRole === 'user'
                        ? 'bg-cyan-400 text-black border-cyan-300 font-bold shadow-lg'
                        : 'bg-black/40 border-white/15 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <User className="w-4 h-4 shrink-0" />
                      <span className="text-[9px] mono uppercase font-bold">
                        Paso 3
                      </span>
                    </div>
                    <div className="text-xs font-extrabold mt-1 truncate">
                      3. Usuario Comprador
                    </div>
                    <div className="text-[10px] opacity-80 leading-tight mt-0.5">
                      Compra entradas con Stripe y recibe tu QR individual
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Profile Photo Upload + Preview */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 flex flex-col sm:flex-row items-center gap-3.5">
                <div className="relative group shrink-0">
                  <img
                    src={previewAvatar}
                    alt="Vista previa foto de perfil"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-lg bg-black"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-lg cursor-pointer"
                    title="Subir foto de perfil desde galería"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                  <div className="text-xs font-bold text-white">
                    {selectedRole === 'admin'
                      ? 'Foto de Perfil / Logo de la Organización *'
                      : selectedRole === 'collab'
                      ? 'Foto de Perfil del Trabajador (Staff QR) *'
                      : 'Foto de Perfil del Comprador (Titular QR) *'}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/20 cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {photoFileName ? 'Cambiar Foto' : 'Subir Foto de Galería'}
                      </span>
                    </button>
                    <input
                      type="text"
                      value={photoURL}
                      onChange={(e) => {
                        setPhotoURL(e.target.value);
                        setPhotoFileName(null);
                      }}
                      placeholder="O pega URL de foto de perfil (opcional)"
                      className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Role-Specific Required Parameters */}
              {selectedRole === 'admin' && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Datos Oficiales de la Productora / Organización</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-neutral-200 font-semibold block mb-1">
                        Nombre de la Organización / Productora *
                      </label>
                      <input
                        type="text"
                        required
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="Ej. Oleaje Live Productions / Bush Brothers"
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold placeholder-neutral-500 outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                        RFC / Registro Fiscal (Opcional)
                      </label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                        placeholder="Ej. OLP260101ACA"
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-neutral-500 outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                        Ciudad / Sede Principal
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Acapulco Diamante, Gro."
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                        Cuenta Stripe Connect (Receptor de Pagos)
                      </label>
                      <input
                        type="email"
                        value={stripeAccountEmail}
                        onChange={(e) => setStripeAccountEmail(e.target.value)}
                        placeholder="pagos@productora.mx"
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                        Instagram / Red Oficial
                      </label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@oleriebeachclub"
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'collab' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                    <DoorOpen className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Parámetros Operativos del Trabajador / Staff QR</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-200 font-semibold block mb-1">
                        Productora a la que pertenece *
                      </label>
                      <input
                        type="text"
                        required
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder={organizer.name || 'Nombre de Productora'}
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-200 font-semibold block mb-1">
                        Puerta / Zona Asignada *
                      </label>
                      <select
                        value={assignedGate}
                        onChange={(e) => setAssignedGate(e.target.value)}
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                      >
                        <option value="Acceso Principal Costera">
                          Acceso Principal Costera
                        </option>
                        <option value="Recepción Sunbeds & VIP">
                          Recepción Sunbeds & VIP
                        </option>
                        <option value="Acceso Playa Diamante">
                          Acceso Playa Diamante
                        </option>
                        <option value="Deck Cabina DJ">Deck Cabina DJ</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-200 font-semibold block mb-1">
                        PIN Operativo (4 dígitos) *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="1234"
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold tracking-widest outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'user' && (
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-3">
                  <div className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Parámetros de Perfil de Usuario Comprador (Titular QR & Stripe)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-200 font-semibold block mb-1">
                        ID / INE / Pasaporte (Respaldo en Puerta)
                      </label>
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={documentId}
                          onChange={(e) => setDocumentId(e.target.value.toUpperCase())}
                          placeholder="Ej. INE-849201"
                          className="w-full bg-black/60 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-neutral-500 outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-200 font-semibold block mb-1">
                        Ciudad de Procedencia
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ej. Ciudad de México / Acapulco"
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Core Credentials: Name, Email, Password, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                    {selectedRole === 'admin'
                      ? 'Nombre del Productor / Representante *'
                      : selectedRole === 'collab'
                      ? 'Nombre Completo del Trabajador *'
                      : 'Nombre Completo del Comprador *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nombre y Apellido"
                      className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                    Teléfono Móvil / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+52 744 123 4567"
                      className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white font-mono placeholder-neutral-500 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                    Contraseña de Seguridad (Mín. 6 caracteres) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {matchedCollab && (
                <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                  <div>
                    <span className="font-bold text-white">
                      ¡Cuenta de Trabajador Pre-Autorizada Detectada!
                    </span>{' '}
                    Tu correo/teléfono coincide con <strong>{matchedCollab.name}</strong> ({matchedCollab.assignedGate}).
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer min-w-0"
              >
                <span className="truncate">
                  {selectedRole === 'admin'
                    ? 'Registrar Productora y Entrar al Panel de Creador'
                    : selectedRole === 'collab'
                    ? 'Registrar Cuenta de Trabajador y Abrir Escáner QR'
                    : 'Registrarme como Usuario Comprador y Ver Cartelera'}
                </span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-neutral-300">
                Ingresa con el correo electrónico y contraseña de cualquiera de los perfiles que hayas registrado (Productora, Trabajador/Staff o Usuario Comprador).
              </div>

              <div>
                <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                  Correo Electrónico Registrado *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                  Contraseña (o PIN para Staff) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>Iniciar Sesión en mi Cuenta</span>
              </button>
            </form>
          )}

          {/* Alternative Firebase Google / Phone OTP Auth Button */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-400 text-center sm:text-left">
              ¿Prefieres vincular con Google Sign-In o SMS OTP?
            </span>
            <button
              type="button"
              onClick={onOpenAuthSession}
              className="w-full sm:w-auto px-4 py-2 rounded-xl liquid-glass-btn text-amber-300 border border-amber-400/35 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition min-w-0"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Google / SMS OTP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unified Floating Bottom Bar */}
      <div className="sticky bottom-3 z-40 mx-auto w-[calc(100%-0.5rem)] max-w-xl pt-2">
        <div className="liquid-blur rounded-3xl border border-white/20 px-3.5 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-2xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <TicketZapLogo size="sm" />
            <div className="min-w-0">
              <div className="space text-xs sm:text-sm font-extrabold tracking-tight leading-none flex items-center gap-1.5">
                <span>HYPE</span>
                <span className="text-neutral-300 font-extrabold tracking-widest">
                  TICKET
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-neutral-400 truncate mt-0.5 font-medium">
                {organizer.name || 'Registro desde Cero · Stripe Ready'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {currentUser.isRegistered && (
              <button
                type="button"
                onClick={() => onSelectPortal(currentUser.role)}
                className="liquid-glass-btn px-3 py-1.5 rounded-full text-[11px] font-bold text-emerald-300 border border-emerald-400/35 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Volver a mi Sesión</span>
              </button>
            )}

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
