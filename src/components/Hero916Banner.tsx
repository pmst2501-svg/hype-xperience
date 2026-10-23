import React, { useRef, useState } from 'react';
import { EventItem, AdminTab } from '../types/ticket';
import { TicketZapLogo } from './TicketZapLogo';
import {
  processUploadedImageFile,
  processUploadedVideoFile,
} from '../utils/mediaHelper';
import {
  Camera,
  Sliders,
  CalendarDays,
  MapPin,
  Ticket,
  Play,
  Building2,
  ArrowUpRight,
  Film,
  CheckCircle2,
} from 'lucide-react';

interface Hero916BannerProps {
  event: EventItem;
  organizerName?: string;
  onOpenStoryVideo: () => void;
  onOpenEditModal: () => void;
  onOpenNewTicketModal: () => void;
  onOpenEditProfile?: () => void;
  onSelectTab: (tab: AdminTab) => void;
  onUpdateHeroImage: (imageUrl: string) => void;
  onUpdateVideoUrl?: (videoUrl: string) => void;
  isAdmin: boolean;
}

export const Hero916Banner: React.FC<Hero916BannerProps> = ({
  event,
  organizerName = 'Bush Brothers Producciones',
  onOpenStoryVideo,
  onOpenEditModal,
  onOpenNewTicketModal,
  onOpenEditProfile,
  onSelectTab,
  onUpdateHeroImage,
  onUpdateVideoUrl,
  isAdmin,
}) => {
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setMediaNotice(msg);
    setTimeout(() => setMediaNotice(null), 3200);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processUploadedImageFile(file);
      onUpdateHeroImage(compressed);
      showNotice(`Portada actualizada desde galería (${file.name})`);
    } catch {
      // ignore
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateVideoUrl) return;
    try {
      const { videoUrl, fileName } = await processUploadedVideoFile(file);
      onUpdateVideoUrl(videoUrl);
      showNotice(`Video 9:16 cargado desde multimedia (${fileName})`);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-500 flex flex-col justify-between p-5 sm:p-7 md:p-8 bg-[#0a0b10] text-white"
      style={{
        minHeight: '440px',
      }}
    >
      {/* Background Image with dark gradient overlay for optimal text contrast */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.95) 80%, rgba(0,0,0,0.99) 100%), url('${event.heroImage}')`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
        }}
      />

      {/* Top Header / Badges */}
      <div className="z-10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <TicketZapLogo size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-extrabold tracking-widest uppercase text-white mono truncate max-w-[180px]">
                  {organizerName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mono font-bold">
                  {event.code}
                </span>
              </div>
              <div className="text-[11px] text-neutral-300 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenEditModal}
              className="px-3 py-1.5 rounded-full liquid-blur hover:bg-white/25 text-white flex items-center gap-1.5 border border-white/20 transition shadow-lg flex-shrink-0 text-xs font-bold cursor-pointer"
              title="Editar datos y multimedia del evento en tiempo real"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Editar Evento</span>
            </button>
          )}
        </div>

        {/* Action pills (wrapped cleanly on all mobile widths) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Watch 9:16 Video Story button */}
          <button
            type="button"
            onClick={onOpenStoryVideo}
            className="px-2.5 py-1.5 rounded-full liquid-blur hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/25 transition shadow-lg group cursor-pointer"
            title="Ver Reel / Video Vertical 9:16 del evento en Oleaje Beach Club"
          >
            <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition shrink-0">
              <Play className="w-2 h-2 fill-black ml-0.5" />
            </div>
            <span>Video 9:16</span>
          </button>

          {isAdmin && (
            <>
              {/* Quick Upload Image from Multimedia */}
              <input
                type="file"
                ref={imageFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-full liquid-blur hover:bg-white/25 text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/20 transition shadow-lg cursor-pointer"
                title="Cargar foto de portada desde tu galería / multimedia"
              >
                <Camera className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Subir Foto</span>
              </button>

              {/* Quick Upload Video Reel from Multimedia */}
              {onUpdateVideoUrl && (
                <>
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-full liquid-blur hover:bg-white/25 text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/20 transition shadow-lg cursor-pointer"
                    title="Cargar video MP4/MOV desde tu dispositivo para la historia 9:16"
                  >
                    <Film className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Subir Video</span>
                  </button>
                </>
              )}

              {onOpenEditProfile && (
                <button
                  type="button"
                  onClick={onOpenEditProfile}
                  className="px-2.5 py-1.5 rounded-full liquid-blur hover:bg-white/25 text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/20 transition shadow-lg cursor-pointer"
                  title="Editar Perfil de Productora"
                >
                  <Building2 className="w-3 h-3 text-white shrink-0" />
                  <span>Productora</span>
                </button>
              )}
            </>
          )}
        </div>

        {mediaNotice && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold w-fit animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{mediaNotice}</span>
          </div>
        )}
      </div>

      {/* Center Hero Visual Hint for 9:16 Story */}
      <div className="my-auto py-6 sm:py-8 flex flex-col items-center justify-center text-center z-10">
        <button
          type="button"
          onClick={onOpenStoryVideo}
          className="group flex flex-col items-center gap-2 focus:outline-none cursor-pointer"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-emerald-400 via-white to-amber-300 shadow-2xl group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full rounded-full bg-black/90 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white ml-1 group-hover:scale-110 transition" />
            </div>
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-white mono bg-black/60 px-3.5 py-1 rounded-full border border-white/20 backdrop-blur-md">
            ▶ Toca para ver Historia 9:16
          </span>
        </button>
      </div>

      {/* Bottom Content & Meta */}
      <div className="z-10 space-y-3 mt-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[11px] text-white font-semibold">
          <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
          <span>{event.formattedDateBadge}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-tight text-white space leading-tight">
          {event.title}
        </h1>

        <p className="text-xs md:text-sm text-neutral-300 font-light leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-3">
          {event.description}
        </p>

        {/* Action bar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => onSelectTab('calendar')}
            className="px-3.5 py-2.5 rounded-full bg-white text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xl hover:bg-neutral-200 transition cursor-pointer min-w-0"
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Calendario</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('location')}
            className="px-3.5 py-2.5 rounded-full liquid-blur hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/20 transition cursor-pointer min-w-0"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Mapa Acapulco</span>
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={onOpenNewTicketModal}
              className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-full bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-xl hover:bg-emerald-300 transition group cursor-pointer min-w-0"
            >
              <Ticket className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Emitir Boleto QR</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenNewTicketModal}
              className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-full bg-white text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-xl shadow-white/10 hover:bg-neutral-200 transition group cursor-pointer min-w-0"
            >
              <Ticket className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Comprar Entrada QR (${event.basePrice} {event.currency})</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
