import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { EventItem, Ticket, UserProfile } from '../types/ticket';
import {
  Play,
  Calendar,
  MapPin,
  Ticket as TicketIcon,
  QrCode,
  Search,
  CheckCircle2,
  ArrowUpRight,
  User,
  ShieldCheck,
  Sparkles,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';

interface AttendeePortalProps {
  events: EventItem[];
  activeEvent: EventItem;
  currentUser: UserProfile;
  userTickets: Ticket[];
  onOpenStoryVideo: () => void;
  onSelectEvent: (eventId: string) => void;
  onBuyTicket: (event: EventItem) => void;
  onOpenMap: (event: EventItem) => void;
  onOpenAuthProfile: () => void;
}

export const AttendeePortal: React.FC<AttendeePortalProps> = ({
  events,
  activeEvent,
  currentUser,
  userTickets,
  onOpenStoryVideo,
  onSelectEvent,
  onBuyTicket,
  onOpenMap,
  onOpenAuthProfile,
}) => {
  const [tab, setTab] = useState<'events' | 'myTickets'>('events');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<Ticket | null>(null);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});

  // Generate real QR code data URLs for each individual ticket
  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const nextMap: Record<string, string> = {};
      for (const tkt of userTickets) {
        try {
          const url = await QRCode.toDataURL(tkt.qrPayload || tkt.folio, {
            width: 320,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          nextMap[tkt.id] = url;
        } catch {
          // Fallback handled in UI
        }
      }
      if (isMounted) {
        setQrDataUrls(nextMap);
      }
    };
    generateAll();
    return () => {
      isMounted = false;
    };
  }, [userTickets]);

  const categories = ['all', ...Array.from(new Set(events.map((e) => e.category)))];

  const filteredEvents = events.filter((e) => {
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesSearch =
      !search.trim() ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.location.city.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getEventTitle = (eventId: string) => {
    return events.find((e) => e.id === eventId)?.title || activeEvent.title;
  };

  return (
    <div className="space-y-6">
      {/* Registered User Profile & QR Wallet Banner */}
      <div className="liquid-blur rounded-3xl p-4 border border-white/15 flex flex-col @md:flex-row items-start @md:items-center justify-between gap-3.5 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName}
            className="w-11 h-11 rounded-2xl object-cover border border-emerald-400/50 shadow-lg shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-extrabold text-white space truncate">
                {currentUser.displayName}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                VERIFICADO
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-neutral-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full @md:w-auto justify-between @md:justify-end">
          <button
            type="button"
            onClick={() => setTab('myTickets')}
            className="flex-1 @md:flex-initial px-3.5 py-2 rounded-xl bg-white text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer hover:bg-neutral-200 transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mis QRs ({userTickets.length})</span>
          </button>
          <button
            type="button"
            onClick={onOpenAuthProfile}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 cursor-pointer transition"
          >
            Editar Perfil
          </button>
        </div>
      </div>

      {/* Featured 9:16 Video Story Showcase Card */}
      <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl glass p-5 bg-gradient-to-r from-neutral-900 via-black to-black">
        <div className="flex flex-col @md:flex-row items-center justify-between gap-5">
          <div className="space-y-2.5 text-left flex-1 min-w-0 w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
              <span>⚡ OLEAJE BEACH CLUB ACAPULCO · HISTORIA 9:16</span>
            </div>
            <h2 className="text-xl @md:text-3xl font-extrabold text-white space tracking-tight leading-snug">
              {activeEvent.title}
            </h2>
            <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
              {activeEvent.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-400 pt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-white font-semibold">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {activeEvent.formattedDateBadge}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{activeEvent.location.city}</span>
              </span>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={() => onBuyTicket(activeEvent)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-white text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xl hover:bg-neutral-200 transition cursor-pointer min-w-0"
              >
                <TicketIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Comprar Boleto QR (${activeEvent.basePrice} {activeEvent.currency})</span>
              </button>
              <button
                type="button"
                onClick={onOpenStoryVideo}
                className="px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition cursor-pointer min-w-0"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 shrink-0" />
                <span className="truncate">Historia 9:16</span>
              </button>
            </div>
          </div>

          {/* 9:16 Story Video Preview Thumbnail (shown on wide @md containers) */}
          <div
            onClick={onOpenStoryVideo}
            className="hidden @md:block w-36 h-52 rounded-2xl overflow-hidden border-2 border-white shadow-2xl cursor-pointer group relative flex-shrink-0"
            style={{ aspectRatio: '9/16' }}
          >
            <img
              src={activeEvent.heroImage}
              alt="Story Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition font-bold">
                <Play className="w-5 h-5 ml-0.5 fill-black" />
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest mt-2 drop-shadow">
                Ver 9:16
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar (Cartelera de Creadores vs Mi Perfil & QRs por Boleto) */}
      <div className="grid grid-cols-2 gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setTab('events')}
          className={`px-3 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            tab === 'events'
              ? 'bg-white text-black shadow-lg shadow-white/10'
              : 'text-neutral-400 hover:text-white glass'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Cartelera ({events.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('myTickets')}
          className={`px-3 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            tab === 'myTickets'
              ? 'bg-white text-black shadow-lg shadow-white/10'
              : 'text-neutral-400 hover:text-white glass'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Perfil QR ({userTickets.length})</span>
        </button>
      </div>

      {/* TAB 1: CARTELERA DE EVENTOS CARGADOS POR CREADORES */}
      {tab === 'events' && (
        <div className="space-y-6">
          {/* Search bar & Category pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar evento en Oleaje Beach Club, Acapulco..."
                className="w-full bg-black/60 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white text-black shadow-md'
                      : 'glass-pill text-neutral-300 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {cat === 'all' ? 'Todos los Eventos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Creator Events */}
          <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt.id)}
                className={`glass rounded-3xl overflow-hidden border transition duration-300 flex flex-col justify-between shadow-2xl group relative cursor-pointer ${
                  evt.id === activeEvent.id
                    ? 'border-emerald-400/60'
                    : 'border-white/15 hover:border-white'
                }`}
              >
                <div className="relative h-52 overflow-hidden bg-black">
                  <img
                    src={evt.heroImage}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="text-[10px] font-bold mono bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20">
                      {evt.category}
                    </span>
                    <span className="text-[10px] font-bold mono bg-emerald-500/80 backdrop-blur-md text-black px-2.5 py-1 rounded-full">
                      {evt.code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBuyTicket(evt);
                    }}
                    className="absolute bottom-3 right-3 px-3.5 py-2 rounded-2xl bg-white text-black font-extrabold text-xs flex items-center gap-1 shadow-2xl group-hover:scale-105 transition"
                    title="Comprar Boleto con QR Individual"
                  >
                    <span>Comprar QR</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-emerald-400 font-mono font-bold">
                      {evt.formattedDateBadge}
                    </div>
                    <h4 className="text-base font-extrabold text-white space leading-tight mt-0.5">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="font-mono text-neutral-300 tabular-nums">
                      Acceso desde:{' '}
                      <strong className="text-white">
                        ${evt.basePrice.toLocaleString()} {evt.currency}
                      </strong>
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono tabular-nums">
                      Cupo: {evt.totalCapacity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MI PERFIL & CARTERA DE CÓDIGOS QR INDIVIDUALES POR BOLETO */}
      {tab === 'myTickets' && (
        <div className="space-y-4">
          <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col @md:flex-row items-start @md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2 space">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Códigos QR Individuales de {currentUser.displayName}</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cada boleto comprado genera un código QR único e irrepetible. Preséntalo en la entrada de Oleaje Beach Club Acapulco.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onBuyTicket(activeEvent)}
              className="w-full @md:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <TicketIcon className="w-3.5 h-3.5" />
              <span>Adquirir Nuevo Boleto</span>
            </button>
          </div>

          {userTickets.length === 0 ? (
            <div className="p-12 text-center glass rounded-3xl border border-white/15 space-y-3">
              <QrCode className="w-10 h-10 text-neutral-500 mx-auto" />
              <h4 className="text-base font-bold text-white">
                Aún no tienes boletos QR en tu perfil
              </h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Compra tus entradas para Oleaje Beach Club Acapulco y recibe al instante un código QR individual por cada boleto adquirido.
              </p>
              <button
                type="button"
                onClick={() => onBuyTicket(activeEvent)}
                className="mt-2 px-5 py-2.5 rounded-full bg-white text-black font-extrabold text-xs cursor-pointer"
              >
                Comprar Mi Primer Boleto QR
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
              {userTickets.map((tkt, idx) => (
                <div
                  key={tkt.id}
                  className="ticket-stub p-5 flex flex-col justify-between space-y-4 border border-white/15"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                        BOLETO INDIVIDUAL #{idx + 1}
                      </span>
                      <span className="mono text-sm font-black text-amber-300 tabular-nums">
                        {tkt.folio}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        tkt.status === 'valid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : tkt.status === 'used'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {tkt.status === 'valid'
                        ? 'QR VÁLIDO · LISTO PARA ESCANEAR'
                        : tkt.status === 'used'
                        ? `ESCANEADO (${tkt.usedAt || 'INGRESADO'})`
                        : 'CANCELADO'}
                    </span>
                  </div>

                  {/* Individual QR Code + Ticket Details */}
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => setSelectedTicketForQR(tkt)}
                      className="w-24 h-24 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 cursor-pointer shadow-lg hover:scale-105 transition"
                      title="Toca para ampliar el código QR de este boleto"
                    >
                      {qrDataUrls[tkt.id] ? (
                        <img
                          src={qrDataUrls[tkt.id]}
                          alt={`QR ${tkt.folio}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="w-16 h-16 text-black" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-emerald-400 truncate">
                        {getEventTitle(tkt.eventId)}
                      </div>
                      <h4 className="text-base font-extrabold text-white truncate">
                        {tkt.guestName}
                      </h4>
                      <div className="text-xs text-neutral-300">
                        Nivel: <strong className="text-white">{tkt.tier}</strong>
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {tkt.seatInfo || 'Acceso General Oleaje Beach Club'}
                      </div>
                      {tkt.status === 'used' && tkt.checkedInByName && (
                        <div className="text-[10px] text-cyan-300 flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>
                            Validado por {tkt.checkedInByName} ({tkt.checkedInGate})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/10">
                    <div className="text-xs text-neutral-400 mono tabular-nums">
                      Pagado: <strong className="text-white">${tkt.price.toLocaleString()} MXN</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTicketForQR(tkt)}
                      className="px-3.5 py-2 rounded-full bg-white text-black text-xs font-black flex items-center justify-center gap-1.5 transition shadow-lg hover:bg-neutral-200 cursor-pointer min-w-0"
                    >
                      <QrCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Mostrar QR en Puerta</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Individual Ticket QR Modal */}
      {selectedTicketForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="glass rounded-3xl p-6 max-w-sm w-full border border-white/20 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="text-left">
                <span className="text-[10px] font-mono uppercase text-emerald-400 block">
                  QR INDIVIDUAL DE ACCESO
                </span>
                <span className="mono text-sm font-black text-white">
                  {selectedTicketForQR.folio}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketForQR(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl mx-auto">
              {qrDataUrls[selectedTicketForQR.id] ? (
                <img
                  src={qrDataUrls[selectedTicketForQR.id]}
                  alt={`QR ${selectedTicketForQR.folio}`}
                  className="w-56 h-56 object-contain mx-auto"
                />
              ) : (
                <div className="w-56 h-56 bg-white flex items-center justify-center">
                  <QrCode className="w-40 h-40 text-black" />
                </div>
              )}
              <div className="text-[11px] font-mono font-bold text-black mt-2 tracking-widest">
                {selectedTicketForQR.folio}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-emerald-400">
                {getEventTitle(selectedTicketForQR.eventId)}
              </div>
              <h4 className="text-lg font-extrabold text-white">
                {selectedTicketForQR.guestName}
              </h4>
              <p className="text-xs text-neutral-300">
                Zona <strong>{selectedTicketForQR.tier}</strong> ·{' '}
                {selectedTicketForQR.seatInfo || 'Oleaje Beach Club Acapulco'}
              </p>
              <p className="text-[11px] text-neutral-400 pt-1">
                Presenta este código QR individual al colaborador en la puerta de Oleaje Beach Club para registrar tu entrada en tiempo real.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTicketForQR(null)}
              className="w-full py-3 rounded-full bg-white text-black font-extrabold text-xs cursor-pointer"
            >
              Cerrar Vista QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
