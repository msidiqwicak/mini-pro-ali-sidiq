import { useState, useEffect } from "react";
import { Check, X, FileImage, Loader2 } from "lucide-react";
import { eventService } from "../../services/event.service";
import { transactionService } from "../../services/transaction.service";
import { formatDateTime, formatCurrency, getStatusColor, getStatusLabel, getAxiosError } from "../../utils/helpers";
import type { Event } from "../../types";

interface TxRow {
  id: string;
  finalAmount: number;
  status: string;
  createdAt: string;
  paymentProofUrl?: string | null;
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
  
  const [actionLoading, setActionLoading] = useState<string | null>(null); // transaction id that is processing
  const [error, setError] = useState("");

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

  const loadTransactions = () => {
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
  };

  useEffect(() => {
    loadTransactions();
  }, [selectedEventId]);

  const handleAction = async (txId: string, action: "approve" | "reject") => {
    setActionLoading(txId);
    setError("");
    try {
      if (action === "approve") {
        await transactionService.approveTransaction(txId);
      } else {
        await transactionService.rejectTransaction(txId);
      }
      loadTransactions(); // refresh
    } catch (err) {
      setError(getAxiosError(err));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">TRANSAKSI</h1>
        <p className="text-sm text-(--text-muted) mt-1">Lihat riwayat dan konfirmasi pembayaran</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

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
      <div className="rounded-xl bg-(--bg-card) border border-(--border) overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-(--text-muted) text-sm">
              {selectedEventId ? "Belum ada transaksi untuk event ini" : "Pilih event untuk melihat transaksi"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-(--border) bg-(--bg-elevated)">
                  <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider px-5 py-3">ID / Pembeli</th>
                  <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider px-5 py-3">Tiket & Harga</th>
                  <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-center text-xs font-medium text-(--text-muted) uppercase tracking-wider px-5 py-3">Bukti / Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-(--bg-elevated) transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-mono text-[10px] text-(--text-muted) mb-1">
                        #{tx.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-white font-medium line-clamp-1">{tx.user.name}</p>
                      <p className="text-xs text-(--text-muted) truncate max-w-[150px]">{tx.user.email}</p>
                    </td>
                    
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {tx.tickets.map((t, i) => (
                          <span key={i} className="badge badge-gray text-[10px]">
                            {t.ticketType.name}
                          </span>
                        ))}
                      </div>
                      <p className="font-semibold text-white text-sm">
                        {formatCurrency(tx.finalAmount)}
                      </p>
                    </td>
                    
                    <td className="px-5 py-4">
                      <span className={`badge text-[10px] ${getStatusColor(tx.status)}`}>
                        {getStatusLabel(tx.status)}
                      </span>
                      <p className="text-[10px] text-(--text-muted) mt-1.5 whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
                      </p>
                    </td>
                    
                    <td className="px-5 py-4">
                      {tx.status === "WAITING_PAYMENT" ? (
                        <div className="flex flex-col items-center gap-2">
                          {tx.paymentProofUrl ? (
                            <a 
                              href={tx.paymentProofUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <FileImage size={14} /> Lihat Bukti
                            </a>
                          ) : (
                            <span className="text-xs text-(--text-muted) italic">Tidak ada bukti</span>
                          )}
                          
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => handleAction(tx.id, "approve")}
                              disabled={actionLoading === tx.id}
                              title="Setujui Pembayaran"
                              className="w-7 h-7 flex items-center justify-center rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === tx.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                              onClick={() => handleAction(tx.id, "reject")}
                              disabled={actionLoading === tx.id}
                              title="Tolak Pembayaran"
                              className="w-7 h-7 flex items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === tx.id ? <Loader2 size={13} className="animate-spin" /> : <X size={14} />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          {tx.paymentProofUrl ? (
                            <a 
                              href={tx.paymentProofUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-(--text-secondary) hover:text-white transition-colors"
                            >
                              <FileImage size={14} /> Lihat Bukti
                            </a>
                          ) : (
                            <span className="text-xs text-(--text-muted)">-</span>
                          )}
                        </div>
                      )}
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
