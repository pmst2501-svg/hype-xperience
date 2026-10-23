import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types/ticket';
import {
  signInWithGoogle,
  saveUserProfileToCloud,
  logOutFirebase,
} from '../firebase';
import {
  X,
  User,
  CheckCircle2,
  Camera,
  ArrowRight,
  LogOut,
  KeyRound,
  UserPlus,
} from 'lucide-react';
import { TicketZapLogo } from './TicketZapLogo';

interface AuthSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  registeredUsers?: UserProfile[];
  onUpdateUser: (updatedUser: UserProfile) => void;
  onSwitchRole: (newRole: UserRole) => void;
  onEnterApp?: (role?: UserRole) => void;
  onOpenZeroRegistration?: () => void;
  initialTab?: 'auth' | 'profile';
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
];

export const AuthSessionModal: React.FC<AuthSessionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  registeredUsers = [],
  onUpdateUser,
  onSwitchRole,
  onEnterApp,
  onOpenZeroRegistration,
  initialTab = 'auth',
}) => {
  const [activeTab, setActiveTab] = useState<'auth' | 'profile'>(initialTab);
  const [nameInput, setNameInput] = useState(currentUser.displayName || '');
  const [emailInput, setEmailInput] = useState(currentUser.email || '');
  const [phoneInput, setPhoneInput] = useState(currentUser.phoneNumber || '');
  const [companyInput, setCompanyInput] = useState(currentUser.company || '');
  const [bioInput, setBioInput] = useState(currentUser.bio || '');
  const [avatarInput, setAvatarInput] = useState(currentUser.photoURL || PRESET_AVATARS[0]);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser.role || 'admin');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const completeAndEnterPortal = (targetRole: UserRole) => {
    onSwitchRole(targetRole);
    if (onEnterApp) {
      onEnterApp(targetRole);
    } else {
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const profile = await signInWithGoogle(selectedRole);
      onUpdateUser(profile);
      showToast(`¡Sesión iniciada con Google como ${profile.displayName}!`);
      completeAndEnterPortal(profile.role);
    } catch (err: any) {
      setErrorMsg(
        'Usa el formulario de Registro desde Cero con correo y contraseña para crear tus cuentas de prueba.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      uid: currentUser.uid || `usr-${Date.now()}`,
      displayName: nameInput.trim() || currentUser.displayName,
      email: emailInput.trim() || currentUser.email,
      phoneNumber: phoneInput.trim() || currentUser.phoneNumber,
      photoURL: avatarInput,
      role: selectedRole,
      company: companyInput.trim() || currentUser.company,
      bio: bioInput.trim() || currentUser.bio,
      isRegistered: true,
    };
    onUpdateUser(updated);
    saveUserProfileToCloud(updated);
    showToast('¡Perfil actualizado y persistido en Firebase!');
    completeAndEnterPortal(selectedRole);
  };

  const handleLogOutAndRegisterNew = async () => {
    await logOutFirebase();
    onClose();
    if (onOpenZeroRegistration) {
      onOpenZeroRegistration();
    }
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (res) => {
      if (res.target?.result) {
        setAvatarInput(res.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg liquid-blur card-curved p-5 sm:p-7 border border-white/20 shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <TicketZapLogo size="sm" />
            <div>
              <h2 className="text-lg font-bold space tracking-tight">
                Gestión de Cuentas y Sesión
              </h2>
              <p className="text-xs text-neutral-400">
                Cambia entre tus cuentas registradas o crea un nuevo perfil desde 0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-white/5 rounded-2xl border border-white/10 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('auth')}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'auth'
                ? 'bg-white text-black shadow-lg font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Mis Cuentas ({registeredUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-black shadow-lg font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Editar Perfil Activo
          </button>
        </div>

        {successMsg && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <X className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 relative z-10 text-sm">
          {activeTab === 'auth' && (
            <div className="space-y-4">
              {/* Active account */}
              {currentUser.isRegistered && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-emerald-500/30 space-y-3">
                  <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                    SESIÓN ACTIVA ACTUALMENTE
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.photoURL || PRESET_AVATARS[0]}
                      alt={currentUser.displayName}
                      className="w-12 h-12 rounded-2xl object-cover border border-white/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white text-xs truncate">
                          {currentUser.displayName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                          {currentUser.role === 'admin'
                            ? 'PRODUCTORA'
                            : currentUser.role === 'collab'
                            ? 'STAFF QR'
                            : 'COMPRADOR'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {currentUser.email}
                      </p>
                      {currentUser.company && (
                        <p className="text-[10px] text-neutral-500 truncate">
                          {currentUser.company}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Registered Accounts List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300">
                    Cuentas Registradas desde Cero ({registeredUsers.length}):
                  </span>
                </div>

                {registeredUsers.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-neutral-400 text-center">
                    Aún no hay cuentas registradas. Usa el botón de abajo para registrar tu Productora, Staff o Usuario Comprador.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {registeredUsers.map((u) => (
                      <div
                        key={u.uid}
                        onClick={() => {
                          onUpdateUser(u);
                          completeAndEnterPortal(u.role);
                        }}
                        className="p-3 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/15 flex items-center justify-between gap-3 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={u.photoURL}
                            alt={u.displayName}
                            className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {u.displayName}{' '}
                              {u.company ? `· ${u.company}` : ''}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate">
                              {u.email}
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-white text-black text-[10px] font-extrabold shrink-0">
                          Cambiar a {u.role === 'admin' ? 'Productora' : u.role === 'collab' ? 'Staff' : 'Comprador'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Register New Profile from 0 Button */}
              <button
                type="button"
                onClick={handleLogOutAndRegisterNew}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Nueva Cuenta desde Cero (Productora / Staff / Comprador)</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full liquid-glass-btn py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-xs text-white border border-white/25 cursor-pointer"
              >
                <span>Vincular con Google Auth</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                <div className="relative group">
                  <img
                    src={avatarInput || PRESET_AVATARS[0]}
                    alt="Avatar Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                  />
                  <label className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1 text-xs text-neutral-300">
                  Haz clic sobre tu foto para cargar una nueva imagen desde tu galería.
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-300 font-medium mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 font-medium mb-1">
                    Nombre de la Organización / Productora
                  </label>
                  <input
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs text-black bg-white hover:bg-neutral-200 cursor-pointer"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={handleLogOutAndRegisterNew}
                  className="px-3.5 py-3 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Nueva Cuenta</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
