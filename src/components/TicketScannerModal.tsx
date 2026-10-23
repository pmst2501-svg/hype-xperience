import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Ticket } from '../types/ticket';
import { ScanValidationResult } from '../utils/ticketingLogic';
import {
  QrCode,
  X,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface TicketScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  activeEventId: string;
  onValidateTicketQr: (rawCode: string) => ScanValidationResult;
}

export const TicketScannerModal: React.FC<TicketScannerModalProps> = ({
  isOpen,
  onClose,
  tickets,
  activeEventId,
  onValidateTicketQr,
}) => {
  const [manualFolio, setManualFolio] = useState('');
  const [scanResult, setScanResult] = useState<ScanValidationResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const validEventTickets = tickets.filter(
    (t) => t.eventId === activeEventId && t.status === 'valid'
  );

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setManualFolio('');
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      // Fallback when running in headless browser or without camera permission
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleVerifyCode = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    const result = onValidateTicketQr(clean);
    setScanResult(result);
    if (result.success) {
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
      setManualFolio('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass rounded-3xl p-5 sm:p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Escáner QR en Tiempo Real
              </h3>
              <p className="text-[10px] text-white/50">
                Oleaje Beach Club · Validación de Boletos Individuales
              </p>
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

        {/* Camera Scanner Viewport */}
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/80 border border-white/15 flex items-center justify-center">
          <video ref={videoRef} playsInline autoPlay className="w-full h-full object-cover" />
          <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-emerald-400/80 animate-pulse shadow-lg shadow-emerald-400" />
          </div>
          <div className="absolute bottom-2 text-[10px] text-white/80 bg-black/70 px-3 py-1 rounded-full">
            Apunta al código QR individual en el perfil del asistente
          </div>
        </div>

        {/* Quick Scan of Pending Valid Tickets */}
        {validEventTickets.length > 0 && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-300 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Escaneo Rápido de Boletos Pendientes ({validEventTickets.length}):
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {validEventTickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleVerifyCode(t.qrPayload || t.folio)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold whitespace-nowrap cursor-pointer transition"
                >
                  {t.folio} · {t.guestName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual lookup input */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/60 block font-medium">
            O verifica ingresando el Folio QR manualmente:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualFolio}
              onChange={(e) => setManualFolio(e.target.value)}
              placeholder="Ej. OLJ-8101-GEN"
              className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 uppercase font-mono outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => handleVerifyCode(manualFolio)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer"
            >
              Validar QR
            </button>
          </div>
        </div>

        {/* Result banner */}
        {scanResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1 ${
              scanResult.success
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {scanResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {scanResult.success ? '¡Acceso QR Autorizado!' : 'Acceso Rechazado'}
              </span>
            </div>
            <p className="text-[11px] opacity-90">{scanResult.message}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
        >
          Cerrar Escáner QR
        </button>
      </div>
    </div>
  );
};
