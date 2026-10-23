import React, { useState, useRef, useEffect } from 'react';
import { EventItem } from '../types/ticket';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MapPin,
  Calendar,
  Ticket,
  Sparkles,
} from 'lucide-react';

interface EventStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  onBuyTicket: () => void;
}

export const EventStoriesModal: React.FC<EventStoriesModalProps> = ({
  isOpen,
  onClose,
  event,
  onBuyTicket,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Autoplay policy might require mute
          setIsMuted(true);
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(pct);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-fadeIn">
      {/* 9:16 Vertical Story Container */}
      <div
        className="relative w-full h-full sm:h-[88vh] sm:max-h-[780px] sm:max-w-[420px] rounded-none sm:rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl flex flex-col justify-between"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Story Video Element */}
        <video
          ref={videoRef}
          src={event.videoStoryUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          autoPlay
          loop
          onTimeUpdate={handleTimeUpdate}
          onClick={togglePlay}
        />

        {/* Dark vignette gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

        {/* Top Story Header & Progress Bar */}
        <div className="relative z-20 p-4 space-y-3">
          {/* Progress bars (Instagram Story style) */}
          <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-400/60 shadow-lg">
                <img
                  src={event.organizer.avatar}
                  alt={event.organizer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white leading-tight">
                    {event.organizer.name}
                  </span>
                  <span className="text-[10px] text-amber-300">★</span>
                </div>
                <div className="text-[10px] text-white/60">
                  Evento de Hoy · Historia 9:16
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                title="Cerrar historia"
                aria-label="Cerrar historia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center play state indicator if paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-2xl">
              <Play className="w-8 h-8 ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Bottom Card & CTA */}
        <div className="relative z-20 p-5 space-y-3">
          <div className="liquid-blur rounded-2xl p-3.5 border border-white/20 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {event.category}
              </span>
              <span className="mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">
                {event.code}
              </span>
            </div>
            <h3 className="text-base font-bold text-white leading-tight">
              {event.title}
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-white/70 pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-300" />
                {event.formattedDateBadge}
              </span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{event.venue}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onBuyTicket();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/30 hover:brightness-110 active:scale-95 transition"
          >
            <Ticket className="w-4 h-4 fill-black" />
            <span>Reservar Boleto · ${event.basePrice} {event.currency}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
