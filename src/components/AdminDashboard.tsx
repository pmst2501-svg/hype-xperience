import React, { useState } from 'react';
import {
  EventItem,
  Ticket,
  Collaborator,
  WristbandVerification,
  VipTable,
} from '../types/ticket';
import { calculateEventMetrics, filterTickets } from '../utils/wristbandLogic';
import { WristbandAuditFeed } from './WristbandAuditFeed';
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
  ShieldAlert,
  Camera,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
} from 'lucide-react';

interface AdminDashboardProps {
  event: EventItem;
  allEvents: EventItem[];
  tickets: Ticket[];
  collaborators: Collaborator[];
  wristbands: WristbandVerification[];
  tables: VipTable[];
  activeTab: 'tickets' | 'wristbands' | 'location' | 'calendar' | 'collaborators' | 'tables';
  onChangeTab: (tab: 'tickets' | 'wristbands' | 'location' | 'calendar' | 'collaborators' | 'tables') => void;
  onOpenNewTicketModal: () => void;
  onOpenNewCollabModal: () => void;
  onOpenCaptureModal: () => void;
  onSelectEvent: (eventId: string) => void;
  onCheckInTicket: (ticketId: string) => void;
  onCancelTicket: (ticketId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  event,
  allEvents,
  tickets,
  collaborators,
  wristbands,
  tables,
  activeTab,
  onChangeTab,
  onOpenNewTicketModal,
  onOpenNewCollabModal,
  onOpenCaptureModal,
  onSelectEvent,
  onCheckInTicket,
  onCancelTicket,
}) => {
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');

  const metrics = calculateEventMetrics(tickets, wristbands, tables, event.totalCapacity);
  const filteredTickets = filterTickets(tickets, ticketSearch, ticketStatusFilter);

  return (
    <div className="space-y-6">
      {/* 4 KPI METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Tickets Sold */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Boletos Vendidos</span>
            <TicketIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black mono text-white">
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

        {/* Metric 2: Validated Check-ins */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Entradas Validadas</span>
            <DoorOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black mono text-cyan-400">
              {metrics.totalEntries}
            </span>
            <span className="text-xs text-white/40 mono">({metrics.checkinPct}%)</span>
          </div>
          <div className="text-[10px] text-white/50 mt-1 flex items-center justify-between">
            <span>En puerta / Brazaletes</span>
            {metrics.fraudAttempts > 0 && (
              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                <ShieldAlert className="w-3 h-3" /> {metrics.fraudAttempts} alerta
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Total Revenue */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Recaudación Total</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black mono gold-text">
              ${metrics.totalRevenue.toLocaleString()} {event.currency}
            </span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
            <span>Boletos + Mesas VIP</span>
          </div>
        </div>

        {/* Metric 4: Active Staff */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Colaboradores</span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black mono text-purple-400">
              {collaborators.filter((c) => c.status === 'active').length}
            </span>
            <span className="text-xs text-white/40">en turno</span>
          </div>
          <div className="text-[10px] text-white/50 mt-1">Puertas & Accesos</div>
        </div>
      </div>

      {/* DASHBOARD TABS CONTAINER */}
      <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Navigation bar for tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 overflow-x-auto bg-black/40">
          <button
            onClick={() => onChangeTab('tickets')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'tickets'
                ? 'bg-white text-black shadow-lg shadow-white/15'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <TicketIcon className="w-3.5 h-3.5" />
            <span>Boletos ({tickets.length})</span>
          </button>

          <button
            onClick={() => onChangeTab('wristbands')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'wristbands'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>Brazaletes Antifraude ({wristbands.length})</span>
          </button>

          <button
            onClick={() => onChangeTab('collaborators')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'collaborators'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff / Colaboradores ({collaborators.length})</span>
          </button>

          <button
            onClick={() => onChangeTab('tables')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'tables'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <GlassWater className="w-3.5 h-3.5" />
            <span>Mesas VIP ({tables.length})</span>
          </button>

          <button
            onClick={() => onChangeTab('location')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'location'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-300" />
            <span>Minimapa</span>
          </button>

          <button
            onClick={() => onChangeTab('calendar')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-amber-300 text-black shadow-lg shadow-amber-300/20'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
            <span>Calendario</span>
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
                    placeholder="Buscar por nombre, folio o tipo de boleto..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="valid">Válidos (sin usar)</option>
                    <option value="used">Usados (ingresados)</option>
                    <option value="cancelled">Cancelados</option>
                  </select>

                  <button
                    onClick={onOpenNewTicketModal}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Emitir Boleto</span>
                  </button>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
                <table className="w-full text-left text-xs text-white/80">
                  <thead className="bg-black/40 text-[11px] font-mono uppercase text-white/50 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">Folio</th>
                      <th className="px-4 py-3">Asistente</th>
                      <th className="px-4 py-3">Nivel / Zona</th>
                      <th className="px-4 py-3">Precio</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-mono font-bold text-amber-300">
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
                        <td className="px-4 py-3 font-mono text-white/90">
                          ${t.price} MXN
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
                            {t.status === 'valid' ? 'Válido' : t.status === 'used' ? 'Usado' : 'Cancelado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {t.status === 'valid' && (
                            <button
                              onClick={() => onCheckInTicket(t.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium border border-emerald-500/30"
                              title="Marcar ingreso manual"
                            >
                              Dar Acceso
                            </button>
                          )}
                          {t.status !== 'cancelled' && (
                            <button
                              onClick={() => onCancelTicket(t.id)}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] border border-rose-500/20"
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

          {/* TAB 2: WRISTBANDS ANTIFRAUD AUDIT */}
          {activeTab === 'wristbands' && (
            <WristbandAuditFeed
              wristbands={wristbands}
              onOpenCaptureModal={onOpenCaptureModal}
            />
          )}

          {/* TAB 3: COLLABORATORS / STAFF */}
          {activeTab === 'collaborators' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Equipo de Colaboradores & Personal de Puerta</span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Cuentas activas con PIN para validación de boletos y captura de fotos de brazaletes.
                  </p>
                </div>
                <button
                  onClick={onOpenNewCollabModal}
                  className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Trabajador</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className="glass p-4 rounded-2xl border border-white/10 space-y-3 hover:border-purple-400/40 transition"
                  >
                    <div className="flex items-center gap-3">
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
                        <div className="text-[10px] text-white/50">{c.assignedGate}</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1 text-[11px]">
                      <div className="flex justify-between text-white/60">
                        <span>PIN de Acceso:</span>
                        <span className="mono text-amber-300 font-bold">{c.pin}</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>Brazaletes validados:</span>
                        <span className="mono text-emerald-400 font-bold">{c.checkinsCount}</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>Última actividad:</span>
                        <span className="text-white/80">{c.lastActive}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TABLES VIP */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GlassWater className="w-4 h-4 text-emerald-400" />
                    <span>Control de Mesas VIP & Reservas</span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Capacidad, consumo mínimo y estado de asignación para la noche.
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
                    <div className="text-sm font-mono font-bold text-amber-300">
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

          {/* TAB 5: MINIMAP */}
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
