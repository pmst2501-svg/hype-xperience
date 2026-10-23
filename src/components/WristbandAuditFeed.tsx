import React, { useState } from 'react';
import { WristbandVerification } from '../types/ticket';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Camera,
  QrCode,
  Search,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';

interface WristbandAuditFeedProps {
  wristbands: WristbandVerification[];
  onOpenCaptureModal: () => void;
}

export const WristbandAuditFeed: React.FC<WristbandAuditFeedProps> = ({
  wristbands,
  onOpenCaptureModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedWristband, setSelectedWristband] = useState<WristbandVerification | null>(null);

  const filteredWristbands = wristbands.filter((wb) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      wb.folio.toLowerCase().includes(q) ||
      (wb.guestName && wb.guestName.toLowerCase().includes(q)) ||
      wb.validatedBy.collabName.toLowerCase().includes(q) ||
      wb.accessGate.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-white/10">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Auditoría de Brazaletes en Vivo (Antifraude)</span>
          </h3>
          <p className="text-[11px] text-white/60 mt-0.5">
            Registro visual y criptográfico de cada brazalete ingresado en puerta con foto, folio, GPS y hora exacta.
          </p>
        </div>
        <button
          onClick={onOpenCaptureModal}
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 whitespace-nowrap transition"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Registrar Brazalete en Puerta</span>
        </button>
      </div>

      {/* Search filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por folio, nombre, staff o puerta..."
          className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-amber-400/50"
        />
      </div>

      {/* Wristbands list */}
      {filteredWristbands.length === 0 ? (
        <div className="p-8 text-center glass rounded-2xl border border-white/10">
          <Camera className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <p className="text-xs text-white/60">No se encontraron brazaletes registrados.</p>
          <button
            onClick={onOpenCaptureModal}
            className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs inline-flex items-center gap-1.5 border border-white/15"
          >
            <Camera className="w-3 h-3 text-amber-300" /> Registrar primer brazalete
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredWristbands.map((wb) => {
            const isFraud = wb.status === 'duplicate_flagged';
            return (
              <div
                key={wb.id}
                onClick={() => setSelectedWristband(wb)}
                className={`glass p-3.5 rounded-2xl border transition cursor-pointer hover:border-amber-400/40 relative flex gap-3 ${
                  isFraud ? 'border-rose-500/40 bg-rose-500/5' : 'border-white/10 hover:bg-white/5'
                }`}
              >
                {/* Captured Photo thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-white/15 flex-shrink-0 bg-black relative">
                  <img
                    src={wb.photoUrl}
                    alt={`Foto brazalete ${wb.folio}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/70 px-1 py-0.5 rounded text-[8px] mono text-white/80">
                    Foto Real
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="mono text-xs font-bold text-amber-300 tracking-wider">
                      {wb.folio}
                    </span>
                    {isFraud ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> DUPLICADO
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> VALIDADO
                      </span>
                    )}
                  </div>

                  {wb.guestName && (
                    <div className="text-xs font-medium text-white truncate">
                      {wb.guestName}
                    </div>
                  )}

                  <div className="text-[11px] text-white/60 flex items-center gap-1 truncate">
                    <Clock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{wb.formattedDateTime}</span>
                  </div>

                  <div className="text-[10px] text-white/50 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{wb.location.venueName} · {wb.accessGate}</span>
                  </div>

                  <div className="text-[10px] text-white/40 flex items-center justify-between pt-1">
                    <span>Validador: {wb.validatedBy.collabName}</span>
                    <span className="text-amber-400 text-[10px] flex items-center gap-0.5 hover:underline">
                      <QrCode className="w-3 h-3" /> Ver QR
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Inspection Modal for Creator */}
      {selectedWristband && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass rounded-3xl p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold mono text-amber-300">
                  {selectedWristband.folio}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {selectedWristband.accessGate}
                </span>
              </div>
              <button
                onClick={() => setSelectedWristband(null)}
                className="w-7 h-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Captured Photo large preview */}
            <div className="rounded-2xl overflow-hidden border border-white/20 aspect-video bg-black relative">
              <img
                src={selectedWristband.photoUrl}
                alt="Foto del brazalete"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-[10px] mono text-amber-300 font-bold border border-white/10">
                FOTOGRAFÍA ORIGINAL DE PUERTA
              </div>
            </div>

            {/* Audit details grid */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Fecha y Hora Exacta:</span>
                <span className="text-white font-mono">{selectedWristband.formattedDateTime}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Coordenadas GPS:</span>
                <span className="text-white font-mono">
                  {selectedWristband.location.latitude.toFixed(5)}, {selectedWristband.location.longitude.toFixed(5)}
                </span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Trabajador / Portero:</span>
                <span className="text-white">{selectedWristband.validatedBy.collabName}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Fingerprint Antifraude:</span>
                <span className="text-amber-400 font-mono text-[10px]">{selectedWristband.photoHash}</span>
              </div>
            </div>

            {/* Raw QR Payload preview */}
            <div>
              <label className="text-[10px] text-white/50 block mb-1 font-mono uppercase">
                Cripto-Payload del Código QR:
              </label>
              <pre className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[10px] mono text-emerald-400 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                {selectedWristband.qrData}
              </pre>
            </div>

            <button
              onClick={() => setSelectedWristband(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
            >
              Cerrar Inspección
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
