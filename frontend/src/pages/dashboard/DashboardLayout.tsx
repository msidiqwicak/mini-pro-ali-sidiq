import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Music2, LayoutDashboard, CalendarDays, ReceiptText,
  BarChart3, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Overview", end: true },
  { to: "/dashboard/events", icon: <CalendarDays size={18} />, label: "Kelola Event" },
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
      } bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[var(--border)]">
        <div
          className="w-8 h-8 bg-[var(--accent-red)] rounded flex items-center justify-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Music2 size={18} className="text-white" />
        </div>
        <span className="font-display text-lg tracking-widest text-white">SOUNDWAVE</span>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-[var(--text-muted)] hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)]">
          <div className="w-9 h-9 rounded-full bg-[var(--accent-red)] flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Organizer</p>
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
                  ? "bg-[var(--accent-red)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-white" : "text-[var(--text-muted)] group-hover:text-white"}>
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
      <div className="px-3 py-4 border-t border-[var(--border)]">
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
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
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-[var(--text-muted)] hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-display text-lg tracking-widest text-white">SOUNDWAVE</span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
