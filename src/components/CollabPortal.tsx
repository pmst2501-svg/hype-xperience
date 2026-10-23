import React, { useState } from 'react';
import { Collaborator, EventItem, Ticket, WristbandVerification } from '../types/ticket';
import {
  Camera,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  AlertTriangle,
  User,
  Sparkles,
  Zap,
  LogIn,
} from 'lucide-react';

interface CollabPortalProps {
  activeStaff: Collaborator;
  event: EventItem;
  wristbands: WristbandVerification[];
  tickets: Ticket[];
  onOpenWristbandCapture: () => void;
  onOpenTicketScanner: () => void;
  onValidateTicketManual: (folioOrQr: string) => { success: boolean; message: string; ticket?: Ticket };
  onOpenAuthSession?: () => void;
}

export const CollabPortal: React.FC<CollabPortalProps> = ({
  activeStaff,
  event,
  wristbands,
  tickets,
  onOpenWristbandCapture,
  onOpenTicketScanner,
  onValidateTicketManual,
  onOpenAuthSession,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [manualResult, setManualResult] = useState<{ success: boolean; message: string; ticket?: Ticket } | null>(null);

  const myWristbands = wristbands.filter(
    (w) => w.validatedBy.collabId === activeStaff.id || w.validatedBy.collabName === activeStaff.name
  );

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const res = onValidateTicketManual(manualCode.trim());
    setManualResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Staff Status & Greeting Card */}
      <div className="liquid-blur p-5 sm:p-6 card-curved border border-white/15 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-emerald-400/40 shadow-xl flex-shrink-0">
              <img
                src={activeStaff.avatar}
                alt={activeStaff.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Terminal de Acceso Staff
                </span>
                <span className="text-xs text-neutral-400">{activeStaff.assignedGate}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5 space">{activeStaff.name}</h2>
              <div className="text-xs text-neutral-400">{activeStaff.roleTitle}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="text-right">
                <div className="text-xs text-neutral-400">Brazaletes Registrados</div>
                <div className="text-xl font-black mono text-emerald-400">
                  {myWristbands.length + activeStaff.checkinsCount}
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
                title="Abrir Mi Perfil / Sesión"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Entrance Worker Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Photo Wristband Capture (Requested Feature) */}
        <div
          onClick={onOpenWristbandCapture}
          className="liquid-blur p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 shadow-2xl hover:border-amber-400 cursor-pointer transition group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/25 group-hover:scale-105 transition">
              <Camera className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                PRUEBA RÁPIDA
              </span>
              <span className="text-[10px] mono bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                PRINCIPAL
              </span>
            </div>
          </div>

          <h3 className="text-base font-bold text-white mt-4 group-hover:text-amber-300 transition space">
            Capturar Brazalete / Prueba de Función
          </h3>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            Toma la foto del brazalete físico o ejecuta la prueba rápida con cliente y nombre aleatorio. Detecta GPS, hora exacta y genera el código QR antifraude.
          </p>

          <button className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-400/20 cursor-pointer">
            <Camera className="w-4 h-4" />
            <span>Abrir Cámara & Modo Prueba</span>
          </button>
        </div>

        {/* QR Scanner for Digital Tickets */}
        <div
          onClick={onOpenTicketScanner}
          className="liquid-blur p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-black/40 to-black/60 shadow-2xl hover:border-emerald-400 cursor-pointer transition group relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-400/25 group-hover:scale-105 transition">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] mono bg-emerald-400/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
              ESCANEO QR
            </span>
          </div>

          <h3 className="text-base font-bold text-white mt-4 group-hover:text-emerald-300 transition space">
            Escanear Código QR
          </h3>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            Escanea el boleto digital en el teléfono del asistente o el QR del brazalete para validar acceso al instante.
          </p>

          <button className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-500/20 cursor-pointer">
            <QrCode className="w-4 h-4" />
            <span>Activar Escáner de Boletos</span>
          </button>
        </div>
      </div>

      {/* Manual Code Check Input */}
      <div className="liquid-blur p-5 card-curved border border-white/10 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mono">
          Validación Manual por Folio / Código
        </h4>
        <form onSubmit={handleManualCheck} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ingresa Folio (ej. HT-8101-GEN o BRZ-4412-CDMX)"
            className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400 uppercase font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/15 cursor-pointer"
          >
            Verificar
          </button>
        </form>

        {manualResult && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
              manualResult.success
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}
          >
            {manualResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{manualResult.message}</span>
          </div>
        )}
      </div>

      {/* Recent Verifications by this worker */}
      <div className="liquid-blur p-5 card-curved border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 space">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Mis Últimas Capturas en Esta Puerta ({myWristbands.length})</span>
          </h4>
          <button
            type="button"
            onClick={onOpenWristbandCapture}
            className="text-xs text-amber-400 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" /> Nueva Captura
          </button>
        </div>

        {myWristbands.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">
            Aún no has registrado brazaletes en esta sesión. Usa el botón "Capturar Brazalete Físico" o ejecuta la prueba rápida.
          </p>
        ) : (
          <div className="divide-y divide-white/10">
            {myWristbands.slice(0, 5).map((wb) => (
              <div key={wb.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0">
                    <img src={wb.photoUrl} alt={wb.folio} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">{wb.folio}</div>
                    <div className="text-[11px] text-neutral-400">{wb.guestName || 'Invitado Verificado'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Aprobado
                  </span>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{wb.formattedDateTime}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
