import { Link } from "react-router-dom";
import { MapPin, Calendar, Users } from "lucide-react";
import type { Event } from "../types";
import {
  formatCurrency,
  formatDateShort,
  getAvailableSeats,
  getSeatPercentage,
  truncate,
} from "../utils/helpers";

interface EventCardProps {
  event: Event;
  style?: React.CSSProperties;
}

const EventCard = ({ event, style }: EventCardProps) => {
  const minPrice = event.ticketTypes.length
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : 0;
  const available = getAvailableSeats(event.totalSeats, event.soldSeats);
  const soldPct = getSeatPercentage(event.totalSeats, event.soldSeats);
  const isSoldOut = available === 0;

  return (
    <Link
      to={`/events/${event.slug}`}
      className="block rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden card-hover animate-fade-in-up opacity-0"
      style={style}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[var(--bg-elevated)]">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-6xl text-[var(--text-muted)] opacity-30">♪</span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="badge badge-red">{event.category.name}</span>
        </div>

        {/* Free badge */}
        {event.isFree && (
          <div className="absolute top-3 right-3">
            <span className="badge badge-green">GRATIS</span>
          </div>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="font-display text-2xl text-white tracking-widest">SOLD OUT</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-[var(--text-primary)] text-base leading-snug mb-2 line-clamp-2">
          {event.name}
        </h3>
        <p className="text-[var(--text-muted)] text-xs mb-4 line-clamp-2">
          {truncate(event.description, 90)}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Calendar size={12} className="text-[var(--accent-red)] flex-shrink-0" />
            <span>{formatDateShort(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <MapPin size={12} className="text-[var(--accent-red)] flex-shrink-0" />
            <span className="truncate">{event.location}, {event.city}</span>
          </div>
        </div>

        {/* Seat bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Users size={11} />
              <span>{available.toLocaleString("id-ID")} tersisa</span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">{soldPct}% terjual</span>
          </div>
          <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${soldPct}%`,
                background:
                  soldPct >= 80
                    ? "var(--accent-red)"
                    : soldPct >= 50
                    ? "var(--accent-gold)"
                    : "#34d399",
              }}
            />
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              Mulai dari
            </p>
            <p className="font-bold text-[var(--accent-red)] text-base">
              {event.isFree ? "GRATIS" : formatCurrency(minPrice)}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--accent-red)] flex items-center justify-center">
            <span className="text-white text-sm">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
