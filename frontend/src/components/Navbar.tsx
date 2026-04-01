import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Music2, Menu, X, LogOut, User, Ticket, LayoutDashboard, ChevronDown } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const loc = useLocation();

  const isActive = (path: string) => loc.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[var(--accent-red)] rounded flex items-center justify-center">
            <Music2 size={18} className="text-white" />
          </div>
          <span className="font-display text-xl tracking-widest text-white">
            SOUNDWAVE
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              isActive("/")
                ? "text-[var(--accent-red)]"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Events
          </Link>

          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn-outline text-sm px-4 py-2">
                Masuk
              </Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-2">
                Daftar
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-[var(--text-secondary)]" />
                  )}
                </div>
                <span className="max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown size={14} className={`transition-transform ${dropOpen ? "rotate-180" : ""}`} />
              </button>

              {dropOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] shadow-xl overflow-hidden"
                  onMouseLeave={() => setDropOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      {user?.role === "ORGANIZER" ? "Organizer" : "Customer"}
                    </p>
                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  </div>

                  {user?.role === "ORGANIZER" ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white transition-colors"
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/my-tickets"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white transition-colors"
                      >
                        <Ticket size={15} /> Tiket Saya
                      </Link>
                      <Link
                        to="/transactions"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white transition-colors"
                      >
                        <User size={15} /> Transaksi
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => { setDropOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-[var(--bg-elevated)] transition-colors border-t border-[var(--border)]"
                  >
                    <LogOut size={15} /> Keluar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[var(--text-secondary)] hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[var(--bg-card)] border-t border-[var(--border)] px-4 py-4 space-y-3">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--text-secondary)] hover:text-white py-2">
            Events
          </Link>
          {!isAuthenticated ? (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block btn-outline text-center text-sm">Masuk</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block btn-primary text-center text-sm">Daftar</Link>
            </>
          ) : (
            <>
              {user?.role === "ORGANIZER" ? (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--text-secondary)] hover:text-white py-2">Dashboard</Link>
              ) : (
                <>
                  <Link to="/my-tickets" onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--text-secondary)] hover:text-white py-2">Tiket Saya</Link>
                  <Link to="/transactions" onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--text-secondary)] hover:text-white py-2">Transaksi</Link>
                </>
              )}
              <button onClick={() => { setMenuOpen(false); logout(); }} className="block w-full text-left text-sm text-red-400 py-2">Keluar</button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
