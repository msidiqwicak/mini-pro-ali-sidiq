import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Users, CalendarDays, Banknote, ArrowRight } from "lucide-react";
import { dashboardService } from "../../services/dashboard.service";
import { eventService } from "../../services/event.service";
import { formatCurrency, getStatusColor, getStatusLabel } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import type { Event } from "../../types";

interface Stats {
  totalEvents: number;
  totalRevenue: number;
  totalAttendees: number;
  recentTransactions: Array<{
    id: string;
    finalAmount: number;
    status: string;
    createdAt: string;
    user: { name: string; email: string };
    event: { name: string };
  }>;
}

const StatCard = ({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) => (
  <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm text-[var(--text-muted)]">{label}</p>
    {sub && <p className="text-xs text-[var(--text-secondary)] mt-1">{sub}</p>}
  </div>
);

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardService.getOverview(), eventService.getOrganizerEvents()])
      .then(([s, e]) => {
        setStats(s.data as Stats);
        setEvents((e.data as Event[]).slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: <CalendarDays size={18} className="text-[var(--accent-red)]" />,
      label: "Total Event",
      value: String(stats?.totalEvents ?? 0),
      color: "bg-[rgba(229,21,43,0.1)]",
    },
    {
      icon: <Banknote size={18} className="text-emerald-400" />,
      label: "Total Pendapatan",
      value: formatCurrency(stats?.totalRevenue ?? 0),
      color: "bg-emerald-400/10",
    },
    {
      icon: <Users size={18} className="text-blue-400" />,
      label: "Total Pengunjung",
      value: (stats?.totalAttendees ?? 0).toLocaleString("id-ID"),
      color: "bg-blue-400/10",
    },
    {
      icon: <TrendingUp size={18} className="text-[var(--accent-gold)]" />,
      label: "Event Aktif",
      value: String(events.filter((e) => e.status === "PUBLISHED").length),
      color: "bg-[rgba(245,166,35,0.1)]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">
          HALO, {user?.name.toUpperCase() ?? "ORGANIZER"}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Selamat datang di dashboard Anda
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent events */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Event Terbaru</h3>
            <Link to="/dashboard/events" className="text-xs text-[var(--accent-red)] hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-muted)]">Belum ada event</p>
              <Link to="/dashboard/events/create" className="btn-primary text-xs mt-3 inline-flex">
                + Buat Event
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]">
                  {event.imageUrl && (
                    <img src={event.imageUrl} alt={event.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{event.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{event.city}</p>
                  </div>
                  <span className={`badge text-[10px] ${getStatusColor(event.status)}`}>
                    {getStatusLabel(event.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Transaksi Terbaru</h3>
            <Link to="/dashboard/transactions" className="text-xs text-[var(--accent-red)] hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>

          {!stats?.recentTransactions?.length ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-muted)]">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      {tx.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.user.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{tx.event.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(tx.finalAmount)}</p>
                    <span className={`badge text-[9px] ${getStatusColor(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
