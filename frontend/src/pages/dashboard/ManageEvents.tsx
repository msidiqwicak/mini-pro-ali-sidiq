import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, CalendarDays } from "lucide-react";
import { eventService } from "../../services/event.service";
import { ModalConfirm } from "../../components/UIComponents";
import type { Event } from "../../types";
import {
  formatDateShort, formatCurrency, getStatusColor, getStatusLabel, getAxiosError,
} from "../../utils/helpers";

const ManageEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setIsLoading(true);
    eventService.getOrganizerEvents()
      .then((r) => setEvents(r.data as Event[]))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await eventService.deleteEvent(deletingId);
      setDeletingId(null);
      load();
    } catch (err) {
      setError(getAxiosError(err));
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">KELOLA EVENT</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {events.length} event total
          </p>
        </div>
        <Link to="/dashboard/events/create" className="btn-primary">
          <Plus size={16} /> Buat Event
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <CalendarDays size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <h3 className="font-semibold text-[var(--text-secondary)] mb-2">Belum ada event</h3>
          <p className="text-sm text-[var(--text-muted)] mb-5">Mulai buat event musik pertamamu</p>
          <Link to="/dashboard/events/create" className="btn-primary">
            <Plus size={14} /> Buat Event Sekarang
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-5 py-3">Event</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3">Tanggal</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3">Tiket</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3">Harga</th>
                  <th className="text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {events.map((event) => {
                  const minPrice = event.ticketTypes?.length
                    ? Math.min(...event.ticketTypes.map((t) => t.price))
                    : 0;

                  return (
                    <tr key={event.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {event.imageUrl ? (
                            <img src={event.imageUrl} alt={event.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                              <span className="text-lg opacity-30">♪</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate max-w-[200px]">
                              {event.name}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">{event.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                        {formatDateShort(event.startDate)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge text-[10px] ${getStatusColor(event.status)}`}>
                          {getStatusLabel(event.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                        {event.soldSeats}/{event.totalSeats}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {event.isFree ? "GRATIS" : formatCurrency(minPrice)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <a
                            href={`/events/${event.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] transition-colors"
                          >
                            <Eye size={14} />
                          </a>
                          <Link
                            to={`/dashboard/events/${event.id}/edit`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] transition-colors"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => setDeletingId(event.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/40 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ModalConfirm
        isOpen={!!deletingId}
        title="Hapus Event"
        message="Apakah kamu yakin ingin menghapus event ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        loading={deleteLoading}
        confirmLabel="Ya, Hapus"
        confirmClass="bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
      />
    </div>
  );
};

export default ManageEvents;
