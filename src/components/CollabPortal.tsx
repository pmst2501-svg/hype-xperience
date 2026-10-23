import React, { useState } from 'react';
import { Collaborator, EventItem, Ticket } from '../types/ticket';
import { ScanValidationResult } from '../utils/ticketingLogic';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Search,
  AlertTriangle,
  Zap,
  LogIn,
  Lock,
  Ticket as TicketIcon,
} from 'lucide-react';

interface CollabPortalProps {
  activeStaff?: Collaborator;
  allStaff: Collaborator[];
  onSelectStaff: (staffId: string) => void;
  event: EventItem;
  tickets: Ticket[];
  onOpenTicketScanner: () => void;
  onValidateTicketQr: (folioOrQr: string) => ScanValidationResult;
  onOpenAuthSession?: () => void;
}

export const CollabPortal: React.FC<CollabPortalProps> = ({
  activeStaff,
  allStaff,
  onSelectStaff,
  event,
  tickets,
  onOpenTicketScanner,
  onValidateTicketQr,
  onOpenAuthSession,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'used'>('all');
  const [lastScanResult, setLastScanResult] = useState<ScanValidationResult | null>(null);

  const staffDisplay: Collaborator = activeStaff || {
    id: 'staff-session',
    name: 'Trabajador de Acceso QR',
    roleTitle: 'Staff Verificación QR · Puerta',
    email: 'Registra tu cuenta de trabajador',
    phone: '',
    pin: '1234',
    status: 'active',
    checkinsCount: 0,
    assignedGate: 'Acceso Principal Costera',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Staff',
    lastActive: 'En turno',
  };

  const eventTickets = tickets.filter((t) => t.status !== 'cancelled');
  const validTickets = eventTickets.filter((t) => t.status === 'valid');
  const scannedTickets = eventTickets.filter((t) => t.status === 'used');

  const filteredTickets = eventTickets.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      t.folio.toLowerCase().includes(q) ||
      t.guestName.toLowerCase().includes(q) ||
      t.guestEmail.toLowerCase().includes(q) ||
      t.tier.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const res = onValidateTicketQr(manualCode.trim());
    setLastScanResult(res);
    if (res.success) {
      setManualCode('');
    }
  };

  const handleQuickValidateNext = () => {
    const nextValid = validTickets[0];
    if (!nextValid) {
      setLastScanResult({
        success: false,
        status: 'not_found',
        message: 'No hay boletos pendientes por escanear en este momento.',
      });
      return;
    }
    const res = onValidateTicketQr(nextValid.qrPayload || nextValid.folio);
    setLastScanResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Scoped Collaborator Notice & Staff Status Card */}
      <div className="liquid-blur p-5 sm:p-6 card-curved border border-white/15 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-emerald-400/40 shadow-xl flex-shrink-0">
              <img
                src={staffDisplay.avatar}
                alt={staffDisplay.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider mono bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Cuenta de Trabajador · Solo Escaneo QR
                </span>
                <span className="text-xs text-neutral-300 font-semibold">
                  {staffDisplay.assignedGate}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5 space">{staffDisplay.name}</h2>
              <div className="text-xs text-neutral-400">
                {staffDisplay.email} {staffDisplay.phone ? `· ${staffDisplay.phone}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="text-right">
                <div className="text-xs text-neutral-400">QRs Escaneados (En Vivo)</div>
                <div className="text-xl font-black mono text-emerald-400 tabular-nums">
                  {scannedTickets.length} / {eventTickets.length}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {onOpenAuthSession && (
              <button
                type="button"
                onClick={onOpenAuthSession}
                className="liquid-glass-btn p-3 rounded-2xl text-xs font-bold text-white border border-white/20 hover:text-amber-300 transition cursor-pointer"
                title="Cambiar Cuenta de Trabajador"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Strict Access Scope Banner */}
        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Modo Trabajador restringido: <strong>Habilitado únicamente para escanear y registrar boletos QR pagados en tiempo real</strong> en {event.venue}.
            </span>
          </div>
          {allStaff.length > 1 && (
            <select
              value={staffDisplay.id}
              onChange={(e) => onSelectStaff(e.target.value)}
              className="w-full sm:w-auto max-w-full truncate bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none"
            >
              {allStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  Turno: {s.name} ({s.assignedGate})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main QR Scanner Actions */}
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
        <div
          onClick={onOpenTicketScanner}
          className="liquid-blur p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-black/40 to-black/60 shadow-2xl hover:border-emerald-400 cursor-pointer transition group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-400/25 group-hover:scale-105 transition">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] mono bg-emerald-400/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
              LECTOR CÁMARA QR
            </span>
          </div>

          <h3 className="text-base font-bold text-white mt-4 group-hover:text-emerald-300 transition space">
            Escanear QR del Boleto en Puerta
          </h3>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            Abre la cámara para leer el código QR individual del comprador y registrar su entrada en tiempo real.
          </p>

          <button
            type="button"
            className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Activar Cámara Escáner QR</span>
          </button>
        </div>

        <div
          onClick={handleQuickValidateNext}
          className="liquid-blur p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 shadow-2xl hover:border-amber-400 cursor-pointer transition group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/25 group-hover:scale-105 transition">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[10px] mono bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full font-bold">
              TIEMPO REAL ({validTickets.length} PENDIENTES)
            </span>
          </div>

          <h3 className="text-base font-bold text-white mt-4 group-hover:text-amber-300 transition space">
            Validar Siguiente Boleto QR Vendido
          </h3>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            Registra al instante el ingreso del siguiente boleto QR pendiente y sincroniza la entrada con la Productora.
          </p>

          <button
            type="button"
            className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-400/20 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Registrar Siguiente QR Válido</span>
          </button>
        </div>
      </div>

      {/* Live Scan Feedback Banner */}
      {lastScanResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in ${
            lastScanResult.success
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
          }`}
        >
          {lastScanResult.success ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-extrabold text-sm text-white">
              {lastScanResult.success ? '¡Check-In QR Registrado en Tiempo Real!' : 'Aviso de Validación QR'}
            </div>
            <p className="mt-0.5">{lastScanResult.message}</p>
          </div>
        </div>
      )}

      {/* Manual Folio / QR Payload Input */}
      <div className="liquid-blur p-5 card-curved border border-white/10 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mono">
          Validación Directa por Folio o Cadena QR
        </h4>
        <form onSubmit={handleManualCheck} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ingresa Folio del Boleto (ej. OLJ-8101-GEN)"
            className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400 uppercase font-mono"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs transition cursor-pointer hover:bg-neutral-200"
          >
            Validar QR
          </button>
        </form>
      </div>

      {/* Real-Time Sold Tickets Registry */}
      <div className="liquid-blur p-5 card-curved border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 space">
              <TicketIcon className="w-4 h-4 text-emerald-400" />
              <span>Padrón de Boletos Vendidos en Tiempo Real ({eventTickets.length})</span>
            </h4>
            <p className="text-[11px] text-neutral-400">
              Aquí aparecen en tiempo real todas las entradas compradas con Stripe para su verificación en puerta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'valid', 'used'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer min-w-0 ${
                  statusFilter === st
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="truncate block">
                  {st === 'all'
                    ? `Todos (${eventTickets.length})`
                    : st === 'valid'
                    ? `Por Ingresar (${validTickets.length})`
                    : `Escaneados (${scannedTickets.length})`}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar comprador o folio en la lista de puerta..."
            className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-400"
          />
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-black/30 border border-white/10 text-xs text-neutral-400">
            Aún no hay boletos registrados en este filtro. Cuando un comprador adquiera su entrada con Stripe, aparecerá aquí al instante.
          </div>
        ) : (
          <div className="divide-y divide-white/10 max-h-96 overflow-y-auto pr-1">
            {filteredTickets.map((tkt) => (
              <div
                key={tkt.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300">{tkt.folio}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold">
                      {tkt.tier}
                    </span>
                  </div>
                  <div className="font-bold text-white truncate mt-0.5">{tkt.guestName}</div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {tkt.guestEmail} · {tkt.paymentMethod || 'Pagado en Stripe'}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {tkt.status === 'valid' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const res = onValidateTicketQr(tkt.qrPayload || tkt.folio);
                        setLastScanResult(res);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Registrar QR</span>
                    </button>
                  ) : (
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] mono bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/30 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        ESCANEADO
                      </span>
                      <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                        {tkt.usedAt} {tkt.checkedInByName ? `· ${tkt.checkedInByName.split(' ')[0]}` : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
