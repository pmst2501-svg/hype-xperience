import React, { useState } from 'react';
import {
  EventItem,
  Ticket,
  Collaborator,
  VipTable,
  AdminTab,
} from '../types/ticket';
import { calculateTicketingMetrics, filterTickets } from '../utils/ticketingLogic';
import { EventMap } from './EventMap';
import { CalendarView } from './CalendarView';
import {
  Ticket as TicketIcon,
  DoorOpen,
  Coins,
  UserCheck,
  Search,
  Plus,
  Users,
  GlassWater,
  MapPin,
  CalendarDays,
  QrCode,
  CheckCircle2,
  Sliders,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  Trash2,
} from 'lucide-react';

interface AdminDashboardProps {
  event: EventItem;
  allEvents: EventItem[];
  tickets: Ticket[];
  collaborators: Collaborator[];
  tables: VipTable[];
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
  onOpenNewTicketModal: () => void;
  onOpenNewCollabModal: () => void;
  onOpenScannerModal: () => void;
  onOpenEditEventModal: () => void;
  onOpenCreateEventModal: () => void;
  onSelectEvent: (eventId: string) => void;
  onCheckInTicket: (ticketId: string) => void;
  onCancelTicket: (ticketId: string) => void;
  onToggleCollaboratorStatus?: (collabId: string) => void;
  onRemoveCollaborator?: (collabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  event,
  allEvents,
  tickets,
  collaborators,
  tables,
  activeTab,
  onChangeTab,
  onOpenNewTicketModal,
  onOpenNewCollabModal,
  onOpenScannerModal,
  onOpenEditEventModal,
  onOpenCreateEventModal,
  onSelectEvent,
  onCheckInTicket,
  onCancelTicket,
  onToggleCollaboratorStatus,
  onRemoveCollaborator,
}) => {
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');

  const metrics = calculateTicketingMetrics(
    tickets,
    tables,
    event.totalCapacity,
    event.id
  );
  const filteredTickets = filterTickets(
    tickets,
    ticketSearch,
    ticketStatusFilter,
    event.id
  );
  const scannedTickets = tickets.filter(
    (t) => t.eventId === event.id && t.status === 'used'
  );

  return (
    <div className="space-y-6">
      {/* Creator Quick Event Bar (Switch Active Event, Edit Multimedia, or Create New Event) */}
      <div className="glass rounded-2xl p-3.5 border border-white/10 flex flex-col @md:flex-row items-stretch @md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono uppercase text-neutral-400 shrink-0 mr-1">
            Eventos ({allEvents.length}):
          </span>
          {allEvents.map((evt) => (
            <button
              key={evt.id}
              type="button"
              onClick={() => onSelectEvent(evt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
                evt.id === event.id
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/15 border border-white/10'
              }`}
            >
              {evt.title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenEditEventModal}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15 transition cursor-pointer min-w-0"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Editar Evento</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateEventModal}
            className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer min-w-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* 4 KPI METRICS GRID */}
      <div className="grid grid-cols-2 @md:grid-cols-4 gap-3">
        {/* Metric 1: Tickets Sold */}
        <div className="glass rounded-2xl p-3.5 flex flex-col justify-between border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-white/60 text-[11px]">
            <span>Boletos Vendidos</span>
            <TicketIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 tabular-nums">
            <span className="text-xl font-black mono text-white">
              {metrics.ticketsSold}
            </span>
            <span className="text-xs text-white/40 mono">/ {event.totalCapacity}</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.capacityPct}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Validated QR Check-ins */}
        <div className="glass rounded-2xl p-3.5 flex flex-col justify-between border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-white/60 text-[11px]">
            <span>QRs Escaneados</span>
            <QrCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 tabular-nums">
            <span className="text-xl font-black mono text-cyan-400">
              {metrics.ticketsCheckedIn}
            </span>
            <span className="text-xs text-white/40 mono">({metrics.checkinPct}%)</span>
          </div>
          <div className="text-[10px] text-white/50 mt-1 flex items-center justify-between">
            <span>Pendientes: {metrics.ticketsPending}</span>
            <span className="text-emerald-400 font-semibold">En vivo</span>
          </div>
        </div>

        {/* Metric 3: Total Revenue */}
        <div className="glass rounded-2xl p-3.5 flex flex-col justify-between border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-white/60 text-[11px]">
            <span>Recaudación Total</span>
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="mt-2 tabular-nums">
            <span className="text-lg font-black mono gold-text">
              ${metrics.totalRevenue.toLocaleString()} {event.currency}
            </span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
            <span>Boletos QR + Sunbeds VIP</span>
          </div>
        </div>

        {/* Metric 4: Active Staff */}
        <div className="glass rounded-2xl p-3.5 flex flex-col justify-between border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-white/60 text-[11px]">
            <span>Colaboradores QR</span>
            <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 tabular-nums">
            <span className="text-xl font-black mono text-purple-400">
              {collaborators.filter((c) => c.status === 'active').length}
            </span>
            <span className="text-xs text-white/40">autorizados</span>
          </div>
          <div className="text-[10px] text-white/50 mt-1">Solo escaneo de boletos</div>
        </div>
      </div>

      {/* DASHBOARD TABS CONTAINER */}
      <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Navigation bar for tabs — responsive grid on phones, pill row on larger screens */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-2 border-b border-white/10 p-3 sm:px-4 sm:py-3 bg-black/40">
          <button
            type="button"
            onClick={() => onChangeTab('tickets')}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              activeTab === 'tickets'
                ? 'bg-white text-black shadow-lg shadow-white/15 font-bold'
                : 'text-white/75 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <TicketIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Boletos QR ({filteredTickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('qrscans')}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              activeTab === 'qrscans'
                ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20 font-bold'
                : 'text-white/75 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Escaneos ({scannedTickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('collaborators')}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              activeTab === 'collaborators'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20 font-bold'
                : 'text-white/75 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Staff ({collaborators.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('tables')}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              activeTab === 'tables'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-bold'
                : 'text-white/75 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <GlassWater className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Sunbeds VIP ({tables.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('location')}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              activeTab === 'location'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 font-bold'
                : 'text-white/75 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="truncate">Mapa Acapulco</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('calendar')}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              activeTab === 'calendar'
                ? 'bg-amber-300 text-black shadow-lg shadow-amber-300/20 font-bold'
                : 'text-white/75 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Calendario</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="p-4 sm:p-6">
          {/* TAB 1: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Buscar por nombre, correo, folio QR o zona..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="w-full sm:w-auto bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="valid">Válidos (QR activo)</option>
                    <option value="used">Escaneados (en evento)</option>
                    <option value="cancelled">Cancelados</option>
                  </select>

                  <button
                    type="button"
                    onClick={onOpenScannerModal}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer min-w-0"
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span className="truncate">Escanear QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenNewTicketModal}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer min-w-0"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="truncate">Emitir Boleto QR</span>
                  </button>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
                <table className="w-full text-left text-xs text-white/80">
                  <thead className="bg-black/40 text-[11px] font-mono uppercase text-white/50 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">Folio QR</th>
                      <th className="px-4 py-3">Titular / Perfil</th>
                      <th className="px-4 py-3">Zona</th>
                      <th className="px-4 py-3">Precio</th>
                      <th className="px-4 py-3">Estado QR</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-mono font-bold text-amber-300 tabular-nums">
                          {t.folio}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{t.guestName}</div>
                          <div className="text-[10px] text-white/40">{t.guestEmail}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-medium">
                            {t.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-white/90 tabular-nums">
                          ${t.price.toLocaleString()} MXN
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.status === 'valid'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : t.status === 'used'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {t.status === 'valid'
                              ? 'QR Válido'
                              : t.status === 'used'
                              ? `Escaneado ${t.usedAt || ''}`
                              : 'Cancelado'}
                          </span>
                          {t.checkedInByName && (
                            <div className="text-[10px] text-white/40 mt-0.5">
                              Por: {t.checkedInByName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {t.status === 'valid' && (
                            <button
                              type="button"
                              onClick={() => onCheckInTicket(t.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 cursor-pointer"
                              title="Registrar check-in QR"
                            >
                              Validar QR
                            </button>
                          )}
                          {t.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => onCancelTicket(t.id)}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] border border-rose-500/20 cursor-pointer"
                              title="Cancelar boleto"
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE QR SCANS AUDIT (Replaces Discontinued Wristbands) */}
          {activeTab === 'qrscans' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Bitácora de Escaneos QR en Tiempo Real · Oleaje Beach Club</span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Monitorea al instante cada boleto escaneado por tus colaboradores autorizados en los accesos del beach club.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenScannerModal}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer shrink-0"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Abrir Escáner QR</span>
                </button>
              </div>

              {scannedTickets.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-black/30 border border-white/10 space-y-2">
                  <QrCode className="w-8 h-8 text-white/30 mx-auto" />
                  <div className="text-xs font-bold text-white">
                    Aún no hay boletos escaneados en este evento
                  </div>
                  <p className="text-[11px] text-white/50">
                    Cuando tus colaboradores escaneen el código QR individual de un asistente en puerta, aparecerá aquí en tiempo real.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scannedTickets.map((tkt) => (
                    <div
                      key={tkt.id}
                      className="p-4 rounded-2xl bg-black/40 border border-cyan-500/25 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-amber-300">
                              {tkt.folio}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold">
                              {tkt.tier}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white truncate">
                            {tkt.guestName}
                          </div>
                          <div className="text-[11px] text-white/50 truncate">
                            Escaneado por:{' '}
                            <strong className="text-cyan-300">
                              {tkt.checkedInByName || 'Staff Autorizado'}
                            </strong>{' '}
                            · {tkt.checkedInGate || 'Acceso Principal'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                          INGRESADO
                        </span>
                        <div className="text-[11px] font-mono text-white/60 mt-1 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{tkt.usedAt || 'En vivo'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COLLABORATORS / STAFF (Authorized by Email or Phone for Scoped QR Check-in) */}
          {activeTab === 'collaborators' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Colaboradores Autorizados para Escaneo QR en Tiempo Real</span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Autoriza colaboradores por su correo electrónico o teléfono registrado. Ellos solo tendrán acceso al módulo de escaneo y registro de QRs de boletos vendidos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenNewCollabModal}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 transition cursor-pointer min-w-0 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Autorizar Colaborador (Email / Tel)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className={`glass p-4 rounded-2xl border space-y-3 transition ${
                      c.status === 'active'
                        ? 'border-white/10 hover:border-purple-400/40'
                        : 'border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/20 flex-shrink-0">
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{c.name}</h4>
                          <div className="text-[11px] text-purple-300 truncate">{c.roleTitle}</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">
                            {c.assignedGate}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-neutral-700 text-neutral-300'
                        }`}
                      >
                        {c.status === 'active' ? 'ACTIVO' : 'PAUSADO'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-white/80 truncate">
                        <Mail className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/80 font-mono">
                        <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                      <div className="flex justify-between text-white/60 pt-1 border-t border-white/10">
                        <span>Permiso asignado:</span>
                        <span className="text-amber-300 font-semibold">Solo Escaneo QR</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>Boletos QR escaneados:</span>
                        <span className="mono text-emerald-400 font-bold tabular-nums">
                          {c.checkinsCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {onToggleCollaboratorStatus && (
                        <button
                          type="button"
                          onClick={() => onToggleCollaboratorStatus(c.id)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition cursor-pointer"
                        >
                          {c.status === 'active' ? 'Pausar Acceso' : 'Reactivar Acceso'}
                        </button>
                      )}
                      {onRemoveCollaborator && (
                        <button
                          type="button"
                          onClick={() => onRemoveCollaborator(c.id)}
                          className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition cursor-pointer"
                          title="Revocar colaborador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TABLES VIP & SUNBEDS OLEAJE BEACH CLUB */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GlassWater className="w-4 h-4 text-emerald-400" />
                    <span>Camas Balinesas, Sunbeds & Mesas VIP · Oleaje Beach Club</span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Zonas frente al mar, alberca infinity y cabina DJ en Acapulco Diamante.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {tables.map((tbl) => (
                  <div
                    key={tbl.id}
                    className="glass p-4 rounded-2xl border border-white/10 space-y-2 hover:border-amber-400/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tbl.tableNumber}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          tbl.status === 'occupied'
                            ? 'bg-rose-500/20 text-rose-300'
                            : tbl.status === 'reserved'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {tbl.status === 'occupied'
                          ? 'OCUPADA'
                          : tbl.status === 'reserved'
                          ? 'RESERVADA'
                          : 'DISPONIBLE'}
                      </span>
                    </div>

                    <div className="text-[11px] text-white/60">{tbl.zone}</div>
                    <div className="text-sm font-mono font-bold text-amber-300 tabular-nums">
                      ${tbl.price.toLocaleString()} MXN
                    </div>

                    <div className="text-[10px] text-white/50 pt-1 border-t border-white/10">
                      Capacidad: {tbl.seats} personas
                      {tbl.reservedBy && (
                        <div className="text-white/80 font-medium truncate mt-0.5">
                          {tbl.reservedBy}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MINIMAP OLEAJE BEACH CLUB ACAPULCO */}
          {activeTab === 'location' && (
            <EventMap
              event={event}
              allEvents={allEvents}
              onSelectEvent={onSelectEvent}
            />
          )}

          {/* TAB 6: CALENDAR */}
          {activeTab === 'calendar' && (
            <CalendarView
              events={allEvents}
              selectedEventId={event.id}
              onSelectEvent={onSelectEvent}
            />
          )}
        </div>
      </div>
    </div>
  );
};
