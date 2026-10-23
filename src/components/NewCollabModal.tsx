import React, { useState } from 'react';
import { Collaborator } from '../types/ticket';
import { Users, X, Key, Shield, Mail, Phone, DoorOpen } from 'lucide-react';

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
  const [roleTitle, setRoleTitle] = useState('Portero Principal · Acceso Brazaletes');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [assignedGate, setAssignedGate] = useState('Puerta Principal A');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCollab: Collaborator = {
      id: `col-${Date.now()}`,
      name: name.trim(),
      roleTitle: roleTitle.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@hypeticket.com`,
      phone: phone.trim() || '+52 55 0000 0000',
      pin: pin.trim() || '1234',
      status: 'active',
      checkinsCount: 0,
      assignedGate,
      avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&w=160&q=80`,
      lastActive: 'Recién agregado',
    };

    onAddCollaborator(newCollab);
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
              <h3 className="text-base font-bold text-white">Agregar Colaborador / Trabajador</h3>
              <p className="text-[10px] text-white/50">Personal de puerta, taquilla o validación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Nombre Completo del Trabajador:
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

          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Puesto / Rol Asignado:
            </label>
            <select
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
            >
              <option value="Portero Principal · Acceso Brazaletes">
                Portero Principal · Acceso Brazaletes
              </option>
              <option value="Acceso VIP & Validación de Mesas">
                Acceso VIP & Validación de Mesas
              </option>
              <option value="Taquilla & Cobro de Boletos">
                Taquilla & Cobro de Boletos
              </option>
              <option value="Supervisor de Seguridad & Antifraude">
                Supervisor de Seguridad & Antifraude
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <DoorOpen className="w-3 h-3 text-emerald-400" />
                <span>Puerta Asignada:</span>
              </label>
              <input
                type="text"
                value={assignedGate}
                onChange={(e) => setAssignedGate(e.target.value)}
                placeholder="Puerta Principal A"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Key className="w-3 h-3 text-amber-300" />
                <span>PIN de Acceso (4 dígitos):</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                Correo Electrónico:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@empresa.mx"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                Teléfono de Contacto:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-lg shadow-purple-500/25"
            >
              Registrar Colaborador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
