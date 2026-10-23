import React, { useState } from 'react';
import { EventItem, Ticket, TicketTier } from '../types/ticket';
import { Ticket as TicketIcon, X, User, Mail, DollarSign, Sparkles } from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  onIssueTicket: (ticket: Ticket) => void;
  isAdmin: boolean;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  event,
  onIssueTicket,
  isAdmin,
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [tier, setTier] = useState<TicketTier>('General');
  const [customPrice, setCustomPrice] = useState<number>(event.basePrice);

  if (!isOpen) return null;

  const getTierPrice = (t: TicketTier) => {
    switch (t) {
      case 'General':
        return event.basePrice;
      case 'VIP':
        return Math.round(event.basePrice * 1.8);
      case 'Backstage':
        return Math.round(event.basePrice * 3.0);
      case 'Mesa VIP':
        return Math.round(event.basePrice * 4.5);
    }
  };

  const handleTierChange = (newTier: TicketTier) => {
    setTier(newTier);
    setCustomPrice(getTierPrice(newTier));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const folioSuffix = Math.floor(1000 + Math.random() * 9000);
    const tierCode = tier === 'General' ? 'GEN' : tier === 'VIP' ? 'VIP' : tier === 'Backstage' ? 'BCK' : 'TAB';
    const folio = `HT-${folioSuffix}-${tierCode}`;

    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      eventId: event.id,
      folio,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim() || 'asistente@hypeticket.com',
      tier,
      price: customPrice,
      status: 'valid',
      issuedAt: new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      qrPayload: `${folio}|${guestName.trim().toUpperCase()}|${event.code}|VALID`,
      seatInfo: tier === 'General' ? 'Pista General' : tier === 'VIP' ? 'Acceso VIP Lounge' : 'Acceso Backstage Preferente',
    };

    onIssueTicket(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass rounded-3xl p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold">
              <TicketIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAdmin ? 'Emitir Nuevo Boleto' : 'Comprar Entrada al Evento'}
              </h3>
              <p className="text-[10px] text-white/50">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Nombre Completo del Asistente:
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ej. Sofía Valenzuela"
                className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Correo Electrónico (para envío de QR):
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="asistente@gmail.com"
                className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/70 block mb-1.5 font-medium">
              Tipo de Entrada / Nivel:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['General', 'VIP', 'Backstage', 'Mesa VIP'] as TicketTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTierChange(t)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition ${
                    tier === t
                      ? 'border-amber-400 bg-amber-400/20 text-white font-bold'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{t}</span>
                    {tier === t && <Sparkles className="w-3 h-3 text-amber-300" />}
                  </div>
                  <div className="text-[11px] font-mono text-amber-300/90 mt-0.5">
                    ${getTierPrice(t)} MXN
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                Precio Asignado (MXN):
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

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
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-extrabold text-xs shadow-lg shadow-amber-400/20"
            >
              {isAdmin ? 'Confirmar y Emitir' : `Pagar $${customPrice} MXN`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
