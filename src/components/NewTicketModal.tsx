import React, { useState, useEffect } from 'react';
import { EventItem, Ticket, TicketTier, UserProfile } from '../types/ticket';
import { generateTicketFolio, generateTicketQrPayload } from '../utils/ticketingLogic';
import {
  Ticket as TicketIcon,
  X,
  User,
  Mail,
  DollarSign,
  Sparkles,
  QrCode,
  Phone,
} from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  currentUser: UserProfile;
  onIssueTickets: (tickets: Ticket[]) => void;
  isAdmin: boolean;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  event,
  currentUser,
  onIssueTickets,
  isAdmin,
}) => {
  const [guestName, setGuestName] = useState(currentUser.displayName || '');
  const [guestEmail, setGuestEmail] = useState(currentUser.email || '');
  const [guestPhone, setGuestPhone] = useState(currentUser.phoneNumber || '');
  const [tier, setTier] = useState<TicketTier>('General');
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(event.basePrice);

  useEffect(() => {
    if (isOpen) {
      setGuestName(currentUser.displayName || '');
      setGuestEmail(currentUser.email || '');
      setGuestPhone(currentUser.phoneNumber || '');
      setTier('General');
      setQuantity(1);
      setCustomPrice(event.basePrice);
    }
  }, [isOpen, currentUser, event]);

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

    const issuedAt = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const seatLabel =
      tier === 'General'
        ? 'Acceso General Playa & Dancefloor'
        : tier === 'VIP'
        ? 'Sunbed & Terraza VIP Frente al Mar'
        : tier === 'Backstage'
        ? 'Deck Cabina DJ & Barra Premium'
        : 'Cama Balinesa Reservada';

    const generatedTickets: Ticket[] = [];
    for (let i = 0; i < quantity; i++) {
      const ticketId = `tkt-${Date.now()}-${i}`;
      const folio = generateTicketFolio(tier, 'OLJ');
      const holderName =
        quantity > 1 ? `${guestName.trim()} (Boleto ${i + 1}/${quantity})` : guestName.trim();

      const qrPayload = generateTicketQrPayload({
        ticketId,
        eventId: event.id,
        eventCode: event.code,
        folio,
        guestName: holderName,
        guestEmail: guestEmail.trim() || currentUser.email,
        tier,
        issuedAt,
      });

      generatedTickets.push({
        id: ticketId,
        eventId: event.id,
        folio,
        guestName: holderName,
        guestEmail: guestEmail.trim() || currentUser.email || 'asistente@hypeticket.com',
        guestPhone: guestPhone.trim() || currentUser.phoneNumber,
        buyerUid: currentUser.uid,
        tier,
        price: customPrice,
        status: 'valid',
        issuedAt,
        qrPayload,
        seatInfo: seatLabel,
      });
    }

    onIssueTickets(generatedTickets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass rounded-3xl p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAdmin ? 'Emitir Boleto con QR Individual' : 'Adquirir Boletos QR · Oleaje'}
              </h3>
              <p className="text-[10px] text-white/50">{event.title}</p>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Nombre del Titular (aparecerá en el Perfil QR):
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                Correo Registrado:
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
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                Teléfono Móvil:
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+52 744 123 4567"
                  className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-white/40 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/70 block mb-1.5 font-medium">
              Zona en Oleaje Beach Club:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['General', 'VIP', 'Backstage', 'Mesa VIP'] as TicketTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTierChange(t)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer ${
                    tier === t
                      ? 'border-amber-400 bg-amber-400/20 text-white font-bold'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{t}</span>
                    {tier === t && <Sparkles className="w-3 h-3 text-amber-300" />}
                  </div>
                  <div className="text-[11px] font-mono text-amber-300/90 mt-0.5 tabular-nums">
                    ${getTierPrice(t).toLocaleString()} MXN
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity selector: generates 1 individual QR per ticket */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Cantidad de Boletos</div>
              <div className="text-[10px] text-emerald-400">
                Se generará 1 QR individual por cada boleto comprado
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                    quantity === n
                      ? 'bg-white text-black shadow'
                      : 'bg-black/40 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                Precio Unitario Asignado (MXN):
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
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-extrabold text-xs shadow-lg shadow-amber-400/20 cursor-pointer min-w-0 truncate"
            >
              {isAdmin
                ? `Emitir ${quantity} QR${quantity > 1 ? 's' : ''}`
                : `Comprar ${quantity} QR ($${(customPrice * quantity).toLocaleString()} MXN)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
