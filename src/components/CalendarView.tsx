import React, { useState } from 'react';
import { EventItem } from '../types/ticket';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface CalendarViewProps {
  events: EventItem[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
}) => {
  // Current view date (November / December 2026 based on events)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(11); // 11 = December (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number>(31);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Find events on selected day or in current month
  const eventsInCurrentMonth = events.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const getEventForDay = (day: number) => {
    return eventsInCurrentMonth.find((e) => {
      const d = new Date(e.date);
      return d.getDate() === day;
    });
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid Container (7 cols) */}
        <div className="lg:col-span-7 glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-4">
          {/* Header Month / Nav */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white space">
                {monthNames[currentMonth]} {currentYear}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono font-semibold text-white/40 pb-1">
            {daysOfWeek.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0 pointer-events-none" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasEvent = !!getEventForDay(day);
              const isSelected = selectedDay === day;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => {
                    setSelectedDay(day);
                    const ev = getEventForDay(day);
                    if (ev) onSelectEvent(ev.id);
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl text-xs font-semibold relative transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-amber-400 to-amber-300 text-black font-extrabold shadow-lg shadow-amber-500/30 scale-105 z-10'
                      : hasEvent
                      ? 'bg-white/10 hover:bg-white/20 text-white font-bold border border-amber-400/40'
                      : 'hover:bg-white/5 text-white/70'
                  }`}
                >
                  <span>{day}</span>
                  {hasEvent && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-1.5 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-white/50 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Día con Evento programado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-400 text-black text-[9px] flex items-center justify-center font-bold">
                ✓
              </span>
              <span>Día seleccionado</span>
            </div>
          </div>
        </div>

        {/* Selected Event Details Card (5 cols) */}
        <div className="lg:col-span-5 glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] mono uppercase px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 font-bold border border-amber-400/20">
                {selectedEvent.category}
              </span>
              <span className="text-xs text-white/50 mono">{selectedEvent.code}</span>
            </div>

            <div className="rounded-2xl overflow-hidden aspect-video border border-white/15 relative">
              <img
                src={selectedEvent.heroImage}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 text-xs font-bold text-white truncate">
                {selectedEvent.title}
              </div>
            </div>

            <h4 className="text-base font-bold text-white">{selectedEvent.title}</h4>
            <p className="text-xs text-white/70 leading-relaxed line-clamp-3">
              {selectedEvent.description}
            </p>

            <div className="space-y-1.5 pt-1 text-xs text-white/70 font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span>{selectedEvent.formattedDateBadge}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{selectedEvent.venue}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-white/50 block">Precio base:</span>
              <span className="text-base font-mono font-bold text-amber-300">
                ${selectedEvent.basePrice} {selectedEvent.currency}
              </span>
            </div>
            <button
              onClick={() => onSelectEvent(selectedEvent.id)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition shadow-md shadow-amber-400/20"
            >
              Seleccionar como Activo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
