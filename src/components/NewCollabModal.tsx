import React, { useState, useRef } from 'react';
import { Collaborator, UserProfile } from '../types/ticket';
import { hashPasswordCredential } from '../utils/ticketingLogic';
import { processUploadedImageFile } from '../utils/mediaHelper';
import {
  Users,
  X,
  Key,
  Mail,
  Phone,
  DoorOpen,
  Lock,
  Camera,
  Upload,
} from 'lucide-react';

interface NewCollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationName?: string;
  onAddCollaborator: (collaborator: Collaborator, workerUserProfile: UserProfile) => void;
}

export const NewCollabModal: React.FC<NewCollabModalProps> = ({
  isOpen,
  onClose,
  organizationName = 'Productora Oficial',
  onAddCollaborator,
}) => {
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Staff Verificación QR · Acceso Principal');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('1234');
  const [assignedGate, setAssignedGate] = useState('Acceso Principal Costera');
  const [avatar, setAvatar] = useState('');
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processUploadedImageFile(file);
      setAvatar(compressed);
      setPhotoFileName(file.name);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!email.trim()) {
      setErrorMsg('Ingresa el correo electrónico para la cuenta del trabajador.');
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      setErrorMsg('Asigna una contraseña de al menos 6 caracteres para la cuenta del trabajador.');
      return;
    }

    setErrorMsg(null);
    const workerUid = `usr-staff-${Date.now().toString(36)}`;
    const collabId = `col-${Date.now().toString(36)}`;
    const passwordHash = hashPasswordCredential(password.trim());
    const resolvedAvatar =
      avatar.trim() ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;

    const newCollab: Collaborator = {
      id: collabId,
      uid: workerUid,
      name: name.trim(),
      roleTitle: roleTitle.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+52 744 000 0000',
      passwordHash,
      pin: pin.trim() || '1234',
      organizationName,
      status: 'active',
      checkinsCount: 0,
      assignedGate,
      avatar: resolvedAvatar,
      lastActive: 'Recién registrado',
    };

    const workerUserProfile: UserProfile = {
      uid: workerUid,
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      phoneNumber: phone.trim() || undefined,
      photoURL: resolvedAvatar,
      role: 'collab',
      company: organizationName,
      assignedGate,
      staffRoleTitle: roleTitle.trim(),
      pin: pin.trim() || '1234',
      bio: `${roleTitle.trim()} · ${assignedGate}`,
      provider: 'email',
      isRegistered: true,
      createdAt: new Date().toISOString(),
    };

    onAddCollaborator(newCollab, workerUserProfile);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setPin('1234');
    setAvatar('');
    setPhotoFileName(null);
    onClose();
  };

  const previewAvatar =
    avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Staff')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="glass rounded-3xl p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Registrar Cuenta de Trabajador / Staff QR
              </h3>
              <p className="text-[10px] text-white/50">
                {organizationName} · Acceso exclusivo a escaneo de QRs vendidos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Worker Profile Photo */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={previewAvatar}
                alt="Avatar trabajador"
                className="w-12 h-12 rounded-2xl object-cover border border-purple-400/50"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shadow cursor-pointer"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">Foto de Perfil del Trabajador</div>
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
                className="mt-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-purple-200 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span className="truncate">
                  {photoFileName || 'Subir foto desde galería'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Nombre Completo del Trabajador *:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Carlos Domínguez"
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Mail className="w-3 h-3 text-purple-400" />
                <span>Correo de Acceso *:</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@productora.com"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Contraseña *:</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mín. 6 caracteres"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>Teléfono / WhatsApp *:</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 744 123 4567"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Key className="w-3 h-3 text-amber-300" />
                <span>PIN Escáner (4 dígitos):</span>
              </label>
              <input
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold tracking-widest outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                Puesto Operativo:
              </label>
              <select
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
              >
                <option value="Staff Verificación QR · Acceso Principal">
                  Staff Verificación QR · Acceso Principal
                </option>
                <option value="Hostess Sunbeds & Mesas VIP QR">
                  Hostess Sunbeds & Mesas VIP QR
                </option>
                <option value="Verificador QR · Acceso Playa Diamante">
                  Verificador QR · Acceso Playa Diamante
                </option>
                <option value="Seguridad & Control de QR Backstage">
                  Seguridad & Control de QR Backstage
                </option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <DoorOpen className="w-3 h-3 text-emerald-400" />
                <span>Puerta Asignada:</span>
              </label>
              <select
                value={assignedGate}
                onChange={(e) => setAssignedGate(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
              >
                <option value="Acceso Principal Costera">Acceso Principal Costera</option>
                <option value="Recepción Sunbeds & VIP">Recepción Sunbeds & VIP</option>
                <option value="Acceso Playa Diamante">Acceso Playa Diamante</option>
                <option value="Deck Cabina DJ">Deck Cabina DJ</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-lg shadow-purple-500/25 cursor-pointer"
            >
              Crear Cuenta de Trabajador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
