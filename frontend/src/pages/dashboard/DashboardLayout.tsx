import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Music2, LayoutDashboard, CalendarDays, ReceiptText,
  BarChart3, LogOut, Menu, X, ChevronRight, TicketPercent, ScanLine,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Overview", end: true },
  { to: "/dashboard/events", icon: <CalendarDays size={18} />, label: "Kelola Event" },
  { to: "/dashboard/promotions", icon: <TicketPercent size={18} />, label: "Kelola Promosi" },
  { to: "/dashboard/attendance", icon: <ScanLine size={18} />, label: "Kehadiran" },
  { to: "/dashboard/transactions", icon: <ReceiptText size={18} />, label: "Transaksi" },
  { to: "/dashboard/analytics", icon: <BarChart3 size={18} />, label: "Analitik" },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={`${
        mobile
          ? "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300"
          : "hidden lg:flex flex-col w-64 h-screen sticky top-0"
      } bg-(--bg-secondary) border-r border-(--border) flex flex-col`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-(--border)">
        <div 
          className="flex items-center gap-3 cursor-pointer group flex-1"
          onClick={() => navigate("/")}
          title="Back to Home"
        >
          <div className="w-8 h-8 bg-(--accent-red) rounded flex items-center justify-center group-hover:bg-red-600 transition-colors">
            <Music2 size={18} className="text-white" />
          </div>
          <span className="font-display text-lg tracking-widest text-white group-hover:text-gray-200 transition-colors">SOUNDWAVE</span>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-(--text-muted) hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-(--border)">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-(--bg-elevated)">
          <div className="w-9 h-9 rounded-full bg-(--accent-red) flex items-center justify-center font-bold text-white text-sm shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-(--text-muted) uppercase tracking-wider">Organizer</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-(--accent-red) text-white"
                  : "text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-white" : "text-(--text-muted) group-hover:text-white"}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-(--border)">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-(--bg-primary) flex">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <Sidebar mobile />
        </>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 lg:px-6 h-14 border-b border-(--border) bg-(--bg-secondary) sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-(--text-muted) hover:text-white">
              <Menu size={20} />
            </button>
            {/* Mobile Logo Link */}
            <span 
              className="lg:hidden font-display text-lg tracking-widest text-white cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
              title="Back to Home"
            >
              SOUNDWAVE
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Back to Events Button */}
            <button
              onClick={() => navigate("/dashboard/events")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-(--border) text-(--text-secondary) hover:text-white hover:bg-(--bg-elevated) transition-all text-sm"
              title="Kembali ke Daftar Event"
            >
              <CalendarDays size={16} />
              <span className="hidden sm:inline">Back to Events</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
