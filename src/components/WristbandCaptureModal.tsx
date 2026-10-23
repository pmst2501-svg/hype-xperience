import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Collaborator, EventItem, Ticket, WristbandVerification, TicketTier } from '../types/ticket';
import {
  generateWristbandFolio,
  createImageFingerprint,
  checkWristbandFraud,
  buildWristbandQRPayload,
  getRandomClientProfile,
  generateProceduralWristbandPhoto,
} from '../utils/wristbandLogic';
import {
  Camera,
  X,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  RefreshCw,
  User,
  Sparkles,
  Zap,
  LogIn,
  ArrowRight,
  Smartphone,
  Check,
} from 'lucide-react';

interface WristbandCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStaff: Collaborator;
  event: EventItem;
  existingWristbands: WristbandVerification[];
  onSaveWristband: (verification: WristbandVerification) => void;
  onRegisterClientTicket?: (ticket: Ticket) => void;
  onOpenAuthSession?: () => void;
}

export const WristbandCaptureModal: React.FC<WristbandCaptureModalProps> = ({
  isOpen,
  onClose,
  activeStaff,
  event,
  existingWristbands,
  onSaveWristband,
  onRegisterClientTicket,
  onOpenAuthSession,
}) => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [folio, setFolio] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedTier, setSelectedTier] = useState<TicketTier>('General');
  const [accessGate, setAccessGate] = useState(activeStaff.assignedGate || 'Puerta Principal A');
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number }>({
    lat: event.location.lat,
    lng: event.location.lng,
    accuracy: 5,
  });
  const [locationStatus, setLocationStatus] = useState<'locating' | 'ready' | 'fallback'>('locating');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [generatedQRUrl, setGeneratedQRUrl] = useState<string | null>(null);
  const [fraudWarning, setFraudWarning] = useState<string | null>(null);
  const [step, setStep] = useState<'capture' | 'verified'>('capture');
  const [savedRecord, setSavedRecord] = useState<WristbandVerification | null>(null);
  const [registeredTicket, setRegisteredTicket] = useState<Ticket | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      setPhotoDataUrl(null);
      setGeneratedQRUrl(null);
      setFraudWarning(null);
      setStep('capture');
      setSavedRecord(null);
      setRegisteredTicket(null);
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setSelectedTier('General');
      setFolio(generateWristbandFolio('BRZ', 'CDMX'));

      // Request geolocation
      if (navigator.geolocation) {
        setLocationStatus('locating');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy),
            });
            setLocationStatus('ready');
          },
          () => {
            setCoords({
              lat: event.location.lat,
              lng: event.location.lng,
              accuracy: 10,
            });
            setLocationStatus('fallback');
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        setLocationStatus('fallback');
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, event]);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setIsCameraActive(false);
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoDataUrl(dataUri);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (eventResult) => {
      const dataUri = eventResult.target?.result as string;
      if (dataUri) {
        setPhotoDataUrl(dataUri);
      }
    };
    reader.readAsDataURL(file);
  };

  // FUNCTIONAL TEST FEATURE: Instant wristband photo simulation + randomized client profile registration
  const handleRunFunctionalTest = async () => {
    const randomProfile = getRandomClientProfile();
    const newFolio = generateWristbandFolio('BRZ', 'CDMX');
    const photo = generateProceduralWristbandPhoto(newFolio, randomProfile.name, randomProfile.tier);

    setFolio(newFolio);
    setGuestName(randomProfile.name);
    setGuestEmail(randomProfile.email);
    setGuestPhone(randomProfile.phone);
    setSelectedTier(randomProfile.tier);
    setPhotoDataUrl(photo);

    // Auto-process and generate QR immediately for fluid testing
    setTimeout(() => {
      processVerificationWithData(newFolio, photo, randomProfile.name, randomProfile.email, randomProfile.phone, randomProfile.tier, randomProfile.price);
    }, 200);
  };

  const processVerificationWithData = async (
    targetFolio: string,
    targetPhotoUrl: string,
    targetName: string,
    targetEmail: string,
    targetPhone: string,
    targetTier: TicketTier,
    ticketPrice = 850
  ) => {
    const now = new Date();
    const timestampIso = now.toISOString();
    const formattedDateTime = now.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const photoHash = createImageFingerprint(targetPhotoUrl);

    // Check anti-fraud
    const fraudCheck = checkWristbandFraud(
      { folio: targetFolio, photoHash },
      existingWristbands
    );

    if (fraudCheck.isFraud) {
      setFraudWarning(fraudCheck.reason || 'Se detectó duplicado o inconsistencia.');
    } else {
      setFraudWarning(null);
    }

    const qrPayload = buildWristbandQRPayload({
      folio: targetFolio,
      timestamp: timestampIso,
      lat: coords.lat,
      lng: coords.lng,
      venueName: event.venue,
      staffName: activeStaff.name,
      photoHash,
      guestName: targetName,
      tier: targetTier,
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      setGeneratedQRUrl(qrDataUrl);

      const verificationRecord: WristbandVerification = {
        id: `wb-${Date.now()}`,
        eventId: event.id,
        folio: targetFolio,
        guestName: targetName.trim() || undefined,
        guestEmail: targetEmail || undefined,
        guestPhone: targetPhone || undefined,
        photoUrl: targetPhotoUrl,
        photoHash,
        timestamp: timestampIso,
        formattedDateTime,
        location: {
          latitude: coords.lat,
          longitude: coords.lng,
          venueName: event.venue,
          accuracyMeters: coords.accuracy,
        },
        validatedBy: {
          collabId: activeStaff.id,
          collabName: activeStaff.name,
          roleTitle: activeStaff.roleTitle,
        },
        qrData: qrPayload,
        status: fraudCheck.isFraud ? 'duplicate_flagged' : 'approved',
        flaggedReason: fraudCheck.reason,
        accessGate,
        ticketTier: targetTier,
      };

      setSavedRecord(verificationRecord);
      onSaveWristband(verificationRecord);

      // Also auto-register customer ticket in database
      const newTicket: Ticket = {
        id: `tkt-wb-${Date.now()}`,
        eventId: event.id,
        folio: `TKT-${targetFolio}`,
        guestName: targetName || 'Cliente Verificado',
        guestEmail: targetEmail || `cliente.${targetFolio.slice(-4).toLowerCase()}@hypeticket.com`,
        guestPhone: targetPhone,
        tier: targetTier,
        price: ticketPrice,
        status: 'used',
        issuedAt: formattedDateTime,
        usedAt: formattedDateTime,
        assignedWristbandFolio: targetFolio,
        qrPayload,
      };

      setRegisteredTicket(newTicket);
      if (onRegisterClientTicket) {
        onRegisterClientTicket(newTicket);
      }

      setStep('verified');
    } catch {
      alert('Error generando código QR de validación');
    }
  };

  const handleProcessAndValidate = () => {
    if (!photoDataUrl || !folio) return;
    const finalName = guestName.trim() || 'Cliente Registrado';
    processVerificationWithData(
      folio,
      photoDataUrl,
      finalName,
      guestEmail || `cliente.${folio.slice(-4).toLowerCase()}@hypeticket.com`,
      guestPhone,
      selectedTier,
      selectedTier === 'VIP' ? 1850 : selectedTier === 'Backstage' ? 3500 : 850
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="liquid-blur card-curved border border-white/20 max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5 space">
                <span>Captura & Registro de Brazalete</span>
                <span className="text-[10px] mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Control Entrada
                </span>
              </h2>
              <div className="text-[11px] text-neutral-400">
                Staff: <span className="text-white font-medium">{activeStaff.name}</span> · {accessGate}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* REDIRECTION BANNER TO AUTH / SESSION BUTTONS SECTION */}
        <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-blue-500/15 border border-white/15 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <LogIn className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">¿Deseas acceder con tu cuenta?</div>
              <div className="text-[10px] text-neutral-300 truncate">Google · Teléfono · Edición de perfil</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenAuthSession) onOpenAuthSession();
            }}
            className="liquid-glass-btn px-3 py-1.5 rounded-xl text-xs font-bold text-white shrink-0 flex items-center gap-1 border border-white/30 cursor-pointer shadow-lg"
          >
            <span>Ir a Sesión</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>

        {/* STEP 1: CAPTURE OR TEST */}
        {step === 'capture' && (
          <div className="space-y-4 pt-1">
            {/* PRUEBA DE FUNCIÓN RÁPIDA (QUICK TEST FEATURE) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-black border border-emerald-500/40 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Prueba de Función Rápida:
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  1 Click
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 mb-2.5">
                Genera automáticamente una foto de brazalete festival, asigna un cliente con nombre aleatorio (México/Latam), genera el QR antifraude y lo registra directo en el sistema.
              </p>
              <button
                type="button"
                onClick={handleRunFunctionalTest}
                className="w-full liquid-glass-btn py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Ejecutar Prueba: Foto + Cliente Aleatorio</span>
              </button>
            </div>

            {/* Camera / Photo preview container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 aspect-video flex flex-col items-center justify-center">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2 z-10">
                    <button
                      onClick={takeSnapshot}
                      className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capturar Fotografía</span>
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-3 py-2 rounded-full bg-black/70 text-white text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : photoDataUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={photoDataUrl}
                    alt="Brazalete capturado"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={() => setPhotoDataUrl(null)}
                      className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[11px] flex items-center gap-1 border border-white/20 backdrop-blur-sm cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Re-tomar</span>
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-emerald-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Foto Lista para Encriptar</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-300">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      O toma foto en vivo del brazalete físico
                    </p>
                    <p className="text-[11px] text-neutral-400 max-w-xs mt-0.5">
                      Se registrará fecha, hora, GPS CDMX y se generará el QR antifraude único.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Activar Cámara</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/15 transition cursor-pointer"
                    >
                      Subir archivo / Galería
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Folio & Client Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-medium flex items-center justify-between">
                  <span>Folio de Brazalete:</span>
                  <button
                    type="button"
                    onClick={() => setFolio(generateWristbandFolio('BRZ', 'CDMX'))}
                    className="text-amber-400 hover:underline text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Auto
                  </button>
                </label>
                <input
                  type="text"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value.toUpperCase())}
                  placeholder="BRZ-XXXX-CDMX"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 font-bold tracking-wider outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-medium flex items-center justify-between">
                  <span>Nombre de Cliente:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const p = getRandomClientProfile();
                      setGuestName(p.name);
                      setGuestEmail(p.email);
                      setGuestPhone(p.phone);
                      setSelectedTier(p.tier);
                    }}
                    className="text-emerald-400 hover:underline text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Aleatorio
                  </button>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ej. Mateo Mendoza"
                    className="w-full bg-black/50 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Puerta / Acceso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-medium">
                  Tipo / Puerta de Acceso:
                </label>
                <select
                  value={accessGate}
                  onChange={(e) => setAccessGate(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="Puerta Principal A">Puerta Principal A</option>
                  <option value="Entrada VIP Norte">Entrada VIP Norte</option>
                  <option value="Taquilla Lateral B">Taquilla Lateral B</option>
                  <option value="Acceso Backstage 1">Acceso Backstage 1</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-medium">
                  Ubicación GPS Detectada:
                </label>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/40 border border-white/10 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <div className="text-[10px] text-neutral-300 truncate">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)} ({event.venue.split('·')[0]})
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <button
              onClick={handleProcessAndValidate}
              disabled={!photoDataUrl || !folio}
              className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition cursor-pointer ${
                photoDataUrl && folio
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-400 text-black hover:brightness-110 active:scale-95 shadow-emerald-500/20'
                  : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Habilitar QR y Validar Brazalete</span>
            </button>
          </div>
        )}

        {/* STEP 2: VERIFIED & QR DISPLAY */}
        {step === 'verified' && savedRecord && generatedQRUrl && (
          <div className="space-y-4 pt-2">
            {fraudWarning ? (
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <div className="font-bold">¡ALERTA DE SEGURIDAD / DUPLICADO!</div>
                  <div className="text-[11px] text-rose-200/80 mt-0.5">{fraudWarning}</div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                  <div className="min-w-0">
                    <div className="font-bold truncate">Brazalete Verificado & Registrado</div>
                    <div className="text-[11px] text-emerald-200/80 truncate">
                      Cliente: {savedRecord.guestName || 'Invitado'} · Nivel {savedRecord.ticketTier || selectedTier}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                  ACTIVO
                </span>
              </div>
            )}

            {/* Physical QR Card with Photo */}
            <div className="liquid-blur rounded-2xl p-4 border border-white/20 bg-gradient-to-b from-white/5 to-black/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    FOLIO: {savedRecord.folio}
                  </span>
                  {savedRecord.guestName && (
                    <span className="text-xs text-white font-medium truncate max-w-[150px]">
                      {savedRecord.guestName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400">{savedRecord.accessGate}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                {/* Generated QR */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white shadow-lg">
                  <img
                    src={generatedQRUrl}
                    alt="Código QR de verificación"
                    className="w-32 h-32 object-contain"
                  />
                  <span className="text-[9px] font-mono text-black font-bold tracking-tight mt-1">
                    ESCANEAR PARA AUDITAR
                  </span>
                </div>

                {/* Captured Photo of wristband */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-neutral-300 font-medium flex items-center gap-1">
                    <Camera className="w-3 h-3 text-amber-300" />
                    <span>Foto Real / Procedural</span>
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden border border-white/20 shadow-md">
                    <img
                      src={savedRecord.photoUrl}
                      alt="Brazalete físico"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Tamper-evident Audit Meta */}
              <div className="pt-2 border-t border-white/10 space-y-1 text-[10px] text-neutral-300 font-mono">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-neutral-400">
                    <Clock className="w-3 h-3 text-amber-300" /> Fecha & Hora:
                  </span>
                  <span className="text-white font-medium">{savedRecord.formattedDateTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-neutral-400">
                    <MapPin className="w-3 h-3 text-emerald-400" /> GPS / Lugar:
                  </span>
                  <span className="text-white truncate max-w-[180px]">
                    {savedRecord.location.latitude.toFixed(4)}, {savedRecord.location.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-neutral-400">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" /> Validador:
                  </span>
                  <span className="text-white">{savedRecord.validatedBy.collabName}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('capture');
                  setPhotoDataUrl(null);
                  setGeneratedQRUrl(null);
                  setFolio(generateWristbandFolio('BRZ', 'CDMX'));
                  setGuestName('');
                }}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-300" />
                <span>Otro Brazalete</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuthSession) onOpenAuthSession();
                }}
                className="py-2.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ir a Mi Perfil</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
