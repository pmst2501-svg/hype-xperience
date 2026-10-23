import React, { useState, useRef } from 'react';
import { EventItem } from '../types/ticket';
import {
  Sliders,
  X,
  MapPin,
  Calendar,
  Camera,
  Film,
  Upload,
  CheckCircle2,
  Sparkles,
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
  const [videoStoryUrl, setVideoStoryUrl] = useState(event.videoStoryUrl || '');
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState(event.basePrice);
  const [totalCapacity, setTotalCapacity] = useState(event.totalCapacity);

  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleHeroImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const res = uploadEvent.target?.result as string;
      if (res) setHeroImage(res);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoStoryUrl(url);
    setVideoFileName(file.name);
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
      <div className="glass rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-white/20 shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold text-white">
              {isCreatingNew ? 'Crear Nuevo Evento' : 'Editar Evento Actual (Bush Brothers)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-xs"
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
                placeholder="NYE-2026"
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
                placeholder="Gala / Festival / VIP"
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

          {/* VIDEO UPLOAD SECTION (Requested Feature) */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Film className="w-4 h-4 text-white" />
                <span>Cargar Video 9:16 del Evento (Historia / Reel)</span>
              </label>
              <span className="text-[10px] mono text-neutral-400">MP4 / WEBM</span>
            </div>

            <p className="text-[11px] text-neutral-400">
              Sube el archivo de video vertical desde tu dispositivo para mostrarlo en el reproductor de historia de los asistentes.
            </p>

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
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-neutral-200 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Seleccionar Video de mi Dispositivo</span>
              </button>

              {videoFileName && (
                <div className="text-[11px] text-white font-mono flex items-center gap-1 bg-black/60 px-3 py-1.5 rounded-xl border border-white/20 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
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

          {/* HERO IMAGE SECTION */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-neutral-300 font-medium flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-white" />
                <span>Imagen de Portada 9:16:</span>
              </label>
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
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/20"
              >
                Subir Imagen
              </button>
            </div>
            <input
              type="text"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none"
            />
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
            <label className="text-[11px] text-neutral-300 block mb-1 font-medium">
              Recinto / Lugar:
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Hotel Grand Luxe · Salón Imperial"
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
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs shadow-lg"
            >
              Guardar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
