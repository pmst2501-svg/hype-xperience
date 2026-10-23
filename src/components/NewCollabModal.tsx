import React, { useState } from 'react';
import { Collaborator } from '../types/ticket';
import { Users, X, Key, Mail, Phone, DoorOpen, Lock } from 'lucide-react';

interface NewCollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCollaborator: (collaborator: Collaborator) => void;
}

export const NewCollabModal: React.FC<NewCollabModalProps> = ({
  isOpen,
  onClose,
  onAddCollaborator,
}) => {
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Staff Verificación QR · Acceso Principal');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [assignedGate, setAssignedGate] = useState('Acceso Principal Costera');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!email.trim() && !phone.trim()) {
      setErrorMsg(
        'Debes proporcionar el correo electrónico o número de teléfono registrado del colaborador.'
      );
      return;
    }

    setErrorMsg(null);
    const newCollab: Collaborator = {
      id: `col-${Date.now()}`,
      name: name.trim(),
      roleTitle: roleTitle.trim(),
      email:
        email.trim().toLowerCase() ||
        `${name.toLowerCase().replace(/\s+/g, '.')}@hypeticket.com`,
      phone: phone.trim() || '+52 744 000 0000',
      pin: pin.trim() || '1234',
      status: 'active',
      checkinsCount: 0,
      assignedGate,
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      lastActive: 'Recién autorizado',
    };

    onAddCollaborator(newCollab);
    setName('');
    setEmail('');
    setPhone('');
    setPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass rounded-3xl p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Autorizar Colaborador por Correo o Teléfono
              </h3>
              <p className="text-[10px] text-white/50">
                Oleaje Beach Club · Acceso exclusivo a escaneo de QRs vendidos
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

        <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-[11px] text-purple-200 flex items-start gap-2">
          <Lock className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
          <span>
            Al agregar el <strong>correo electrónico o teléfono registrado</strong> de tu colaborador, la plataforma le habilitará únicamente el escáner QR en tiempo real sin acceso a edición de eventos ni finanzas.
          </span>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Nombre Completo del Colaborador *:
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
                <span>Correo Registrado *:</span>
              </label>
              <input
                type="email"
                required={!phone.trim()}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@correo.com"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>Teléfono Registrado *:</span>
              </label>
              <input
                type="tel"
                required={!email.trim()}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 744 123 4567"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Rol en Oleaje Beach Club:
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <DoorOpen className="w-3 h-3 text-emerald-400" />
                <span>Puerta en Oleaje:</span>
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

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Key className="w-3 h-3 text-amber-300" />
                <span>PIN Operativo:</span>
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
              Autorizar Colaborador QR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
