import { useState, useEffect } from "react";
import { eventService } from "../../services/event.service";
import { formatDateTime, formatCurrency, getStatusColor, getStatusLabel } from "../../utils/helpers";
import type { Event } from "../../types";

interface TxRow {
  id: string;
  finalAmount: number;
  status: string;
  createdAt: string;
  tickets: Array<{ ticketType: { name: string } }>;
  user: { name: string; email: string };
  event: { name: string };
}

const DashboardTransactions = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);

  useEffect(() => {
    eventService.getOrganizerEvents()
      .then((r) => {
        const evs = r.data as Event[];
        setEvents(evs);
        if (evs.length > 0) setSelectedEventId(evs[0]!.id);
      })
      .catch(() => {})
      .finally(() => setFetchingEvents(false));
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setIsLoading(true);
    import("../../services/api").then(({ default: api }) =>
      api.get(`/dashboard/analytics?type=event-attendees&eventId=${selectedEventId}`)
        .then((r) => {
          const data = r.data as { data: TxRow[] };
          setTransactions(data.data ?? []);
        })
        .catch(() => setTransactions([]))
        .finally(() => setIsLoading(false))
    );
  }, [selectedEventId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">TRANSAKSI</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Lihat transaksi per event</p>
      </div>

      {/* Event selector */}
      {!fetchingEvents && (
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="input-field max-w-sm"
        >
          <option value="">Pilih Event</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      )}

      {/* Table */}
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-muted)] text-sm">
              {selectedEventId ? "Belum ada transaksi untuk event ini" : "Pilih event untuk melihat transaksi"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                  {["ID", "Pembeli", "Tiket", "Total", "Status", "Tanggal"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-[var(--text-muted)]">
                      #{tx.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white">{tx.user.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{tx.user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {tx.tickets.map((t, i) => (
                          <span key={i} className="badge badge-gray text-[10px]">
                            {t.ticketType.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-white text-sm">
                      {formatCurrency(tx.finalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge text-[10px] ${getStatusColor(tx.status)}`}>
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDateTime(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTransactions;
