import React, { useState } from 'react';
import { EventItem, Ticket } from '../types/ticket';
import {
  Sparkles,
  Play,
  Calendar,
  MapPin,
  Ticket as TicketIcon,
  QrCode,
  Search,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';

interface AttendeePortalProps {
  events: EventItem[];
  activeEvent: EventItem;
  userTickets: Ticket[];
  onOpenStoryVideo: () => void;
  onSelectEvent: (eventId: string) => void;
  onBuyTicket: (event: EventItem) => void;
  onOpenMap: (event: EventItem) => void;
}

export const AttendeePortal: React.FC<AttendeePortalProps> = ({
  events,
  activeEvent,
  userTickets,
  onOpenStoryVideo,
  onSelectEvent,
  onBuyTicket,
  onOpenMap,
}) => {
  const [tab, setTab] = useState<'events' | 'myTickets'>('events');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<Ticket | null>(null);

  const categories = ['all', ...Array.from(new Set(events.map((e) => e.category)))];

  const filteredEvents = events.filter((e) => {
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesSearch =
      !search.trim() ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Featured 9:16 Video Story Showcase Card (Inspired by Left Mobile Screen in Mockup) */}
      <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl glass p-5 sm:p-7 bg-gradient-to-r from-neutral-900 via-black to-black">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-mono font-bold border border-white/20">
              <span>⚡ EVENTO DE HOY · HISTORIA VERTICAL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white space tracking-tight">
              {activeEvent.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-lg line-clamp-2 leading-relaxed">
              {activeEvent.description}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-neutral-400 pt-1">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {activeEvent.formattedDateBadge}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-neutral-300 truncate">
                <MapPin className="w-3.5 h-3.5 text-white" />
                {activeEvent.location.city}
              </span>
            </div>
          </div>

          {/* 9:16 Story Video Preview Thumbnail */}
          <div
            onClick={onOpenStoryVideo}
            className="w-32 h-44 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-white shadow-2xl cursor-pointer group relative flex-shrink-0"
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

      {/* Navigation Bar (Cartelera vs Mis Boletos) */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setTab('events')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            tab === 'events'
              ? 'bg-white text-black shadow-lg shadow-white/10'
              : 'text-neutral-400 hover:text-white glass'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Cartelera de Eventos ({events.length})</span>
        </button>
        <button
          onClick={() => setTab('myTickets')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            tab === 'myTickets'
              ? 'bg-white text-black shadow-lg shadow-white/10'
              : 'text-neutral-400 hover:text-white glass'
          }`}
        >
          <TicketIcon className="w-4 h-4" />
          <span>Mis Boletos Comprados ({userTickets.length})</span>
        </button>
      </div>

      {/* TAB 1: CARTELERA DE EVENTOS */}
      {tab === 'events' && (
        <div className="space-y-6">
          {/* Search bar & Category pills (Directly matching Right Screen in Mockup) */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search object, event, venue..."
                className="w-full bg-black/60 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-white"
              />
            </div>

            {/* Category Pills (All, Sculpture, Artwork, Exhibition, Event style) */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? 'bg-white text-black shadow-md'
                      : 'glass-pill text-neutral-300 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {cat === 'all' ? 'All Events' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: RECENT EVENTS - Physical Ticket Stub Banner (Matching Mockup Right Screen) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-white space">
                Recent Events & Ticket
              </h3>
              <span className="text-[11px] text-neutral-400 mono">01 / 02</span>
            </div>

            <div className="ticket-stub p-4 sm:p-5 flex flex-col sm:flex-row items-stretch gap-4">
              {/* Left Barcode Strip */}
              <div className="w-full sm:w-12 h-10 sm:h-auto rounded-xl barcode-vertical-dark flex items-center justify-center flex-shrink-0 relative opacity-95">
                <span className="text-[9px] mono font-bold text-white uppercase tracking-widest sm:-rotate-90 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded">
                  {activeEvent.code}
                </span>
              </div>

              {/* Main Ticket Info */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span>MAR 24TH</span>
                  <span>FEB 2026</span>
                </div>
                <h4 className="text-lg sm:text-xl font-extrabold text-white space truncate">
                  {activeEvent.title}
                </h4>
                <div className="text-xs text-neutral-300 truncate">
                  {activeEvent.venue}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-neutral-400 pt-1 font-mono">
                  <span>Capacity: {activeEvent.totalCapacity}</span>
                  <span>·</span>
                  <span>Main Hall</span>
                </div>
              </div>

              {/* Action Button: Details */}
              <div className="flex items-center justify-end sm:justify-center flex-shrink-0">
                <button
                  onClick={() => onBuyTicket(activeEvent)}
                  className="px-6 py-3 rounded-full bg-white hover:bg-neutral-200 text-black font-extrabold text-xs flex items-center gap-2 shadow-xl transition group"
                >
                  <span>Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: MOST POPULAR - Grid of Events Cards (Matching Mockup Right Screen) */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white space">
              Most Popular
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="glass rounded-3xl overflow-hidden border border-white/15 hover:border-white transition duration-300 flex flex-col justify-between shadow-2xl group relative"
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden bg-black">
                    <img
                      src={evt.heroImage}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    
                    {/* Floating Category Pill */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="text-[10px] font-bold mono bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20">
                        {evt.category}
                      </span>
                    </div>

                    {/* Arrow Button Overlay */}
                    <button
                      onClick={() => onBuyTicket(evt)}
                      className="absolute bottom-3 right-3 w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition"
                      title="Reservar Entrada"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-extrabold text-white space leading-tight group-hover:text-neutral-200 transition">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-white flex-shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="font-mono text-neutral-400">
                        Price: <strong className="text-white">${evt.basePrice} {evt.currency}</strong>
                      </span>
                      <button
                        onClick={() => onOpenMap(evt)}
                        className="text-neutral-400 hover:text-white text-[11px] underline flex items-center gap-0.5"
                      >
                        Mapa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MIS BOLETOS (Physical Monochrome Ticket Stubs) */}
      {tab === 'myTickets' && (
        <div className="space-y-4">
          {userTickets.length === 0 ? (
            <div className="p-12 text-center glass rounded-3xl border border-white/15 space-y-3">
              <TicketIcon className="w-10 h-10 text-neutral-500 mx-auto" />
              <h4 className="text-base font-bold text-white">No tienes boletos adquiridos</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Explora los eventos en cartelera y adquiere tus entradas para recibirlas en tu cartera digital.
              </p>
              <button
                onClick={() => setTab('events')}
                className="mt-2 px-5 py-2.5 rounded-full bg-white text-black font-extrabold text-xs"
              >
                Ver Cartelera de Eventos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="ticket-stub p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="mono text-xs font-extrabold text-white">{tkt.folio}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        tkt.status === 'valid'
                          ? 'bg-white text-black'
                          : tkt.status === 'used'
                          ? 'bg-neutral-700 text-white'
                          : 'bg-neutral-900 text-neutral-500 border border-neutral-700'
                      }`}
                    >
                      {tkt.status === 'valid' ? 'VÁLIDO' : tkt.status === 'used' ? 'INGRESADO' : 'CANCELADO'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-white">{tkt.guestName}</h4>
                    <div className="text-xs text-neutral-400 mt-1">
                      Zona: <span className="text-white font-semibold">{tkt.tier}</span> · {tkt.seatInfo || 'Acceso General'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="text-xs text-neutral-400 mono">
                      Price: ${tkt.price} MXN
                    </div>
                    <button
                      onClick={() => setSelectedTicketForQR(tkt)}
                      className="px-4 py-2 rounded-full bg-white text-black text-xs font-black flex items-center gap-1.5 transition shadow-lg"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Ver Código QR</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket QR Modal */}
      {selectedTicketForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="glass rounded-3xl p-6 max-w-sm w-full border border-white/20 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="mono text-xs font-bold text-white">
                {selectedTicketForQR.folio}
              </span>
              <button
                onClick={() => setSelectedTicketForQR(null)}
                className="w-7 h-7 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl">
              <div className="w-48 h-48 bg-black flex flex-col items-center justify-center p-2 rounded-xl text-center">
                <QrCode className="w-36 h-36 text-white" />
                <span className="text-[9px] font-mono text-white/80 mt-1">
                  {selectedTicketForQR.folio}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white">{selectedTicketForQR.guestName}</h4>
              <p className="text-xs text-neutral-400 mt-1">
                {selectedTicketForQR.tier} · Presenta este código en la puerta para recibir tu brazalete
              </p>
            </div>

            <button
              onClick={() => setSelectedTicketForQR(null)}
              className="w-full py-3 rounded-full bg-white text-black font-extrabold text-xs"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
