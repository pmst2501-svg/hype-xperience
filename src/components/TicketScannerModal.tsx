import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Ticket, WristbandVerification } from '../types/ticket';
import {
  QrCode,
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface TicketScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  wristbands: WristbandVerification[];
  onCheckInTicket: (ticketId: string) => void;
}

export const TicketScannerModal: React.FC<TicketScannerModalProps> = ({
  isOpen,
  onClose,
  tickets,
  wristbands,
  onCheckInTicket,
}) => {
  const [manualFolio, setManualFolio] = useState('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    type: 'ticket' | 'wristband' | 'unknown';
    title: string;
    description: string;
    item?: Ticket | WristbandVerification;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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
      // Camera permission or device fallback
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleVerifyCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    // Check if it's a ticket
    const foundTicket = tickets.find(
      (t) => t.folio.toUpperCase() === clean || t.qrPayload.toUpperCase().includes(clean)
    );

    if (foundTicket) {
      if (foundTicket.status === 'valid') {
        onCheckInTicket(foundTicket.id);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        setScanResult({
          success: true,
          type: 'ticket',
          title: `¡Acceso Válido! · ${foundTicket.guestName}`,
          description: `Boleto ${foundTicket.tier} ($${foundTicket.price} MXN). Acceso autorizado.`,
          item: foundTicket,
        });
      } else if (foundTicket.status === 'used') {
        setScanResult({
          success: false,
          type: 'ticket',
          title: '⚠️ Boleto Ya Utilizado',
          description: `Este boleto (${foundTicket.folio}) ya fue registrado a las ${foundTicket.usedAt || 'fecha previa'}.`,
          item: foundTicket,
        });
      } else {
        setScanResult({
          success: false,
          type: 'ticket',
          title: '❌ Boleto Cancelado',
          description: 'Este boleto fue cancelado en el sistema y no permite ingreso.',
          item: foundTicket,
        });
      }
      return;
    }

    // Check if it's a wristband
    const foundWristband = wristbands.find(
      (w) => w.folio.toUpperCase() === clean || w.qrData.toUpperCase().includes(clean)
    );

    if (foundWristband) {
      if (foundWristband.status === 'approved') {
        setScanResult({
          success: true,
          type: 'wristband',
          title: `✓ Brazalete Válido · ${foundWristband.folio}`,
          description: `Registrado en ${foundWristband.location.venueName} a las ${foundWristband.formattedDateTime}.`,
          item: foundWristband,
        });
      } else {
        setScanResult({
          success: false,
          type: 'wristband',
          title: '🚨 Alerta Antifraude en Brazalete',
          description: foundWristband.flaggedReason || 'Brazalete marcado como sospechoso o duplicado.',
          item: foundWristband,
        });
      }
      return;
    }

    setScanResult({
      success: false,
      type: 'unknown',
      title: 'Código No Encontrado',
      description: `El folio "${clean}" no coincide con ningún boleto o brazalete activo.`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass rounded-3xl p-5 sm:p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Escáner de Boletos & Brazaletes</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/80 border border-white/15 flex items-center justify-center">
          <video ref={videoRef} playsInline autoPlay className="w-full h-full object-cover" />
          {/* Scanning frame reticle */}
          <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-emerald-400/80 animate-pulse shadow-lg shadow-emerald-400" />
          </div>
          <div className="absolute bottom-2 text-[10px] text-white/60 bg-black/60 px-2.5 py-1 rounded-full">
            Apunta la cámara al código QR
          </div>
        </div>

        {/* Manual lookup input */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/60 block font-medium">
            O escribe el Folio para verificar:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualFolio}
              onChange={(e) => setManualFolio(e.target.value)}
              placeholder="Ej. HT-8101-GEN o BRZ-4412-CDMX"
              className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 uppercase font-mono outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleVerifyCode(manualFolio)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
            >
              Comprobar
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
              <span>{scanResult.title}</span>
            </div>
            <p className="text-[11px] opacity-80">{scanResult.description}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
        >
          Cerrar Escáner
        </button>
      </div>
    </div>
  );
};
