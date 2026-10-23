import React, { useState } from 'react';
import { EventItem } from '../types/ticket';
import {
  MapPin,
  Navigation,
  Compass,
  ExternalLink,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

interface EventMapProps {
  event: EventItem;
  allEvents?: EventItem[];
  onSelectEvent?: (eventId: string) => void;
}

export const EventMap: React.FC<EventMapProps> = ({
  event,
  allEvents = [],
  onSelectEvent,
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(15);

  const { lat, lng, venueName, address, city } = event.location;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  // Leaflet / OpenStreetMap embedded dark iframe view
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.006}%2C${lng + 0.008}%2C${lat + 0.006}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="space-y-4">
      {/* Venue Info Header Card */}
      <div className="glass p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] mono uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Ubicación Oficial
              </span>
              <span className="text-xs text-white/50">{city}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">{venueName}</h3>
            <p className="text-xs text-white/70 max-w-lg mt-0.5">{address}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyCoords}
            className="px-3 py-2 rounded-xl glass hover:bg-white/15 text-xs text-white/80 flex items-center gap-1.5 transition"
            title="Copiar coordenadas GPS"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
            <span className="mono text-[11px]">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Cómo Llegar (Google Maps)</span>
          </a>

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 flex items-center gap-1.5 transition"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Waze</span>
          </a>
        </div>
      </div>

      {/* Map Surface */}
      <div className="glass rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl h-[380px] sm:h-[460px]">
        {/* Interactive OpenStreetMap Container */}
        <iframe
          title="Mapa del Evento"
          src={mapEmbedUrl}
          className="w-full h-full border-0 filter invert contrast-125 brightness-75 hue-rotate-180"
          loading="lazy"
        />

        {/* Floating Overlay Badge on Map */}
        <div className="absolute top-4 left-4 z-10 glass px-4 py-2.5 rounded-2xl border border-white/20 shadow-xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-xs font-bold text-white">{event.title}</div>
            <div className="text-[10px] text-white/60">{venueName}</div>
          </div>
        </div>

        {/* Floating Quick Events Switcher */}
        {allEvents.length > 1 && onSelectEvent && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto pb-1">
            {allEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => onSelectEvent(e.id)}
                className={`px-3.5 py-2 rounded-2xl glass text-left text-xs whitespace-nowrap transition flex items-center gap-2 border ${
                  e.id === event.id
                    ? 'border-amber-400/80 bg-amber-400/20 text-white font-bold'
                    : 'border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <MapPin className="w-3 h-3 text-amber-300" />
                <span>{e.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
