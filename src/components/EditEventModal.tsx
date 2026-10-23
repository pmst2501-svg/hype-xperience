import React, { useState, useRef, useEffect } from 'react';
import { EventItem } from '../types/ticket';
import {
  processUploadedImageFile,
  processUploadedVideoFile,
} from '../utils/mediaHelper';
import {
  Sliders,
  X,
  Camera,
  Film,
  Upload,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  onSaveEvent: (updated: EventItem) => void;
  isCreatingNew?: boolean;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSaveEvent,
  isCreatingNew = false,
}) => {
  const [title, setTitle] = useState(event.title);
  const [code, setCode] = useState(event.code);
  const [category, setCategory] = useState(event.category);
  const [description, setDescription] = useState(event.description);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [venue, setVenue] = useState(event.venue);
  const [address, setAddress] = useState(event.address);
  const [lat, setLat] = useState(event.location.lat);
  const [lng, setLng] = useState(event.location.lng);
  const [heroImage, setHeroImage] = useState(event.heroImage);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [videoStoryUrl, setVideoStoryUrl] = useState(event.videoStoryUrl || '');
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState(event.basePrice);
  const [totalCapacity, setTotalCapacity] = useState(event.totalCapacity);

  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (isCreatingNew) {
      setTitle('Oleaje Sunset Sessions · Edición Especial');
      setCode(`ACA-${Math.floor(100 + Math.random() * 900)}`);
      setCategory('Beach Club & Sunset Party');
      setDescription(
        'Nueva fecha oficial en Oleaje Beach Club Acapulco. Música frente al mar, sunbeds VIP y acceso exclusivo con QR individual por boleto.'
      );
      setDate('2026-12-12');
      setTime('17:00');
      setVenue('Oleaje Beach Club · Acapulco Diamante');
      setAddress('Blvd. Barra Vieja Km 5.5, Playa Diamante, Acapulco de Juárez, Gro.');
      setLat(16.7944);
      setLng(-99.8115);
      setHeroImage(
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
      );
      setVideoStoryUrl(
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      );
      setBasePrice(1500);
      setTotalCapacity(600);
      setImageFileName(null);
      setVideoFileName(null);
    } else {
      setTitle(event.title);
      setCode(event.code);
      setCategory(event.category);
      setDescription(event.description);
      setDate(event.date);
      setTime(event.time);
      setVenue(event.venue);
      setAddress(event.address);
      setLat(event.location.lat);
      setLng(event.location.lng);
      setHeroImage(event.heroImage);
      setVideoStoryUrl(event.videoStoryUrl || '');
      setBasePrice(event.basePrice);
      setTotalCapacity(event.totalCapacity);
      setImageFileName(null);
      setVideoFileName(null);
    }
  }, [isOpen, isCreatingNew, event]);

  if (!isOpen) return null;

  const handleHeroImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processUploadedImageFile(file);
      setHeroImage(compressed);
      setImageFileName(file.name);
    } catch {
      // ignore
    }
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { videoUrl, fileName } = await processUploadedVideoFile(file);
      setVideoStoryUrl(videoUrl);
      setVideoFileName(fileName);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedDateBadge = `${date} · ${time} hrs`;

    const updated: EventItem = {
      ...event,
      id: isCreatingNew ? `evt-${Date.now()}` : event.id,
      title: title.trim(),
      code: code.trim().toUpperCase(),
      category: category.trim(),
      description: description.trim(),
      date,
      time,
      formattedDateBadge,
      venue: venue.trim(),
      address: address.trim(),
      location: {
        ...event.location,
        lat: Number(lat),
        lng: Number(lng),
        venueName: venue.trim(),
        address: address.trim(),
        city: 'Acapulco, Guerrero',
      },
      heroImage,
      videoStoryUrl: videoStoryUrl.trim() || undefined,
      basePrice: Number(basePrice),
      totalCapacity: Number(totalCapacity),
    };

    onSaveEvent(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="glass rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-white/20 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                {isCreatingNew
                  ? 'Cargar Nuevo Evento en Cartelera'
                  : 'Editar Evento y Multimedia en Tiempo Real'}
              </h3>
              <p className="text-[10px] text-neutral-400">
                Sincronización automática con la boletera de Oleaje Beach Club Acapulco
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-neutral-300 block mb-1 font-medium">
              Nombre del Evento:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-neutral-300 block mb-1 font-medium">
                Código del Evento:
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="OLEAJE-ACA-26"
                className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-300 block mb-1 font-medium">
                Categoría:
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Beach Club & Sunset Party"
                className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-neutral-300 block mb-1 font-medium">
              Descripción del Evento:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white"
            />
          </div>

          {/* MULTIMEDIA IMAGE UPLOAD SECTION */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Imagen de Portada desde Multimedia / Galería</span>
              </label>
              <span className="text-[10px] mono text-emerald-300">JPG / PNG / WEBP</span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={heroImage}
                alt="Vista previa portada"
                className="w-16 h-20 rounded-xl object-cover border border-white/20 shrink-0"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={heroFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeroImageFile}
                />
                <button
                  type="button"
                  onClick={() => heroFileInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Seleccionar Imagen de Multimedia</span>
                </button>
                {imageFileName && (
                  <div className="text-[11px] text-emerald-300 font-mono flex items-center gap-1 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{imageFileName}</span>
                  </div>
                )}
              </div>
            </div>

            <input
              type="text"
              value={heroImage}
              onChange={(e) => {
                setHeroImage(e.target.value);
                setImageFileName(null);
              }}
              placeholder="O pega una URL de imagen (https://...)"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none"
            />
          </div>

          {/* MULTIMEDIA VIDEO UPLOAD SECTION */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Video 9:16 desde Multimedia / Galería</span>
              </label>
              <span className="text-[10px] mono text-amber-300">MP4 / MOV / WEBM</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="file"
                ref={videoFileInputRef}
                accept="video/*"
                className="hidden"
                onChange={handleVideoFile}
              />
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-neutral-200 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Seleccionar Video de mi Dispositivo</span>
              </button>

              {videoFileName && (
                <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1 bg-black/60 px-3 py-1.5 rounded-xl border border-white/20 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate">{videoFileName}</span>
                </div>
              )}
            </div>

            <div className="pt-1">
              <input
                type="text"
                value={videoStoryUrl}
                onChange={(e) => {
                  setVideoStoryUrl(e.target.value);
                  setVideoFileName(null);
                }}
                placeholder="O escribe una URL de video (https://.../video.mp4)"
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-neutral-300 block mb-1 font-medium">
                Fecha del Evento:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-300 block mb-1 font-medium">
                Hora de Inicio:
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-neutral-300 block mb-1 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recinto / Sede en Acapulco:</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Oleaje Beach Club · Acapulco Diamante"
              className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-neutral-300 block mb-1 font-medium">
                Precio Base (MXN):
              </label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-300 block mb-1 font-medium">
                Aforo Total (Capacidad):
              </label>
              <input
                type="number"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
                className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs shadow-lg cursor-pointer"
            >
              {isCreatingNew ? 'Publicar Evento en Tiempo Real' : 'Guardar Cambios en Vivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
