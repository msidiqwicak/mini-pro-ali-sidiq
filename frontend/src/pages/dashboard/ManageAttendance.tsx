import { useState, useEffect } from "react";
import { ScanLine, CheckCircle, Search, Users, ChevronDown } from "lucide-react";
import api from "../../services/api";

interface Ticket {
  id: string;
  qrCode: string;
  isUsed: boolean;
  createdAt: string;
  ticketType: { name: string };
  transaction: {
    id: string;
    finalAmount: number;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  };
}

interface OrganizerEvent {
  id: string;
  name: string;
  startDate: string;
}

const ManageAttendance = () => {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [scanning, setScanningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Load organizer's events
  useEffect(() => {
    api.get("/events/organizer/mine")
      .then((r: { data?: { data?: OrganizerEvent[] } }) => {
        const list = (r.data?.data ?? []) as OrganizerEvent[];
        setEvents(list);
        if (list.length > 0) setSelectedEventId(list[0]!.id);
      })
      .catch(() => setError("Gagal memuat daftar event"))
      .finally(() => setLoadingEvents(false));
  }, []);

  // Load tickets when event changes
  useEffect(() => {
    if (!selectedEventId) return;
    setLoadingTickets(true);
    setTickets([]);
    setError("");
    api.get(`/tickets/event/${selectedEventId}`)
      .then((r: { data?: { data?: Ticket[] } }) => setTickets(r.data?.data ?? []))
      .catch(() => setError("Gagal memuat data tiket"))
      .finally(() => setLoadingTickets(false));
  }, [selectedEventId]);

  const handleScan = async (ticketId: string) => {
    setScanningId(ticketId);
    try {
      await api.patch(`/tickets/${ticketId}/scan`);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, isUsed: true } : t))
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Gagal scan tiket";
      setError(msg);
    } finally {
      setScanningId(null);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.transaction.user.name.toLowerCase().includes(q) ||
      t.transaction.user.email.toLowerCase().includes(q) ||
      t.qrCode.toLowerCase().includes(q)
    );
  });

  const attended = tickets.filter((t) => t.isUsed).length;
  const total = tickets.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">KEHADIRAN</h1>
          <p className="text-sm text-(--text-muted) mt-1">Tandai kehadiran peserta event</p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{attended}<span className="text-(--text-muted) text-lg">/{total}</span></p>
            <p className="text-xs text-(--text-muted)">peserta hadir</p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
      )}

      {/* Event selector */}
      <div className="relative">
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          disabled={loadingEvents}
          className="w-full appearance-none input-field pr-10 cursor-pointer"
        >
          {loadingEvents ? (
            <option>Memuat event...</option>
          ) : events.length === 0 ? (
            <option>Tidak ada event</option>
          ) : (
            events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))
          )}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />
      </div>

      {/* Stats bar */}
      {total > 0 && (
        <div className="p-4 rounded-xl bg-(--bg-card) border border-(--border)">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-(--text-secondary)">Progres Kehadiran</span>
            <span className="text-white font-medium">{Math.round((attended / total) * 100)}%</span>
          </div>
          <div className="h-2 bg-(--bg-elevated) rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(attended / total) * 100}%`,
                background: attended === total ? "#34d399" : "var(--accent-red)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-(--text-muted) mt-2">
            <span className="flex items-center gap-1"><CheckCircle size={11} className="text-green-400" /> {attended} hadir</span>
            <span className="flex items-center gap-1"><Users size={11} /> {total - attended} belum hadir</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
        <input
          type="text"
          placeholder="Cari nama, email, atau QR code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {/* Ticket list */}
      {loadingTickets ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-(--bg-card) border border-(--border)">
          <ScanLine size={36} className="mx-auto mb-3 text-(--text-muted) opacity-30" />
          <p className="text-(--text-secondary) font-medium">
            {tickets.length === 0 ? "Belum ada tiket terjual untuk event ini" : "Tidak ada hasil pencarian"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-(--bg-card) border border-(--border) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-(--border) bg-(--bg-elevated)">
                  <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider px-5 py-3">Peserta</th>
                  <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider px-4 py-3">Tiket</th>
                  <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider px-4 py-3">Total Bayar</th>
                  <th className="text-left text-xs font-medium text-(--text-muted) uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-(--text-muted) uppercase tracking-wider px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {filtered.map((ticket) => (
                  <tr key={ticket.id} className={`transition-colors ${ticket.isUsed ? "opacity-60" : "hover:bg-(--bg-elevated)"}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-(--accent-red) flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {ticket.transaction.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{ticket.transaction.user.name}</p>
                          <p className="text-xs text-(--text-muted) truncate">{ticket.transaction.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-white">{ticket.ticketType.name}</p>
                      <p className="text-[10px] text-(--text-muted) font-mono mt-0.5">{ticket.qrCode.slice(0, 12)}…</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-white">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(ticket.transaction.finalAmount)}
                      </p>
                      <p className="text-[10px] text-(--text-muted) mt-0.5">1 tiket</p>
                    </td>
                    <td className="px-4 py-4">
                      {ticket.isUsed ? (
                        <span className="badge badge-green text-[10px]">
                          <CheckCircle size={9} className="mr-1" /> Hadir
                        </span>
                      ) : (
                        <span className="badge badge-gray text-[10px]">Belum Hadir</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {ticket.isUsed ? (
                        <span className="text-xs text-(--text-muted) italic">Sudah discan</span>
                      ) : (
                        <button
                          onClick={() => handleScan(ticket.id)}
                          disabled={scanning === ticket.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--accent-red) text-white text-xs font-medium hover:bg-red-500 transition-colors disabled:opacity-50 ml-auto"
                        >
                          <ScanLine size={13} />
                          {scanning === ticket.id ? "Memproses..." : "Tandai Hadir"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAttendance;
