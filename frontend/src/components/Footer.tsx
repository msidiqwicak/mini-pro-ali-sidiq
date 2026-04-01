import { Music2 } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] mt-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[var(--accent-red)] rounded flex items-center justify-center">
              <Music2 size={18} className="text-white" />
            </div>
            <span className="font-display text-xl tracking-widest text-white">SOUNDWAVE</span>
          </Link>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
            Platform terdepan untuk menemukan dan menghadiri event musik terbaik di seluruh Indonesia.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-semibold text-sm text-white mb-4 uppercase tracking-wider">Platform</h4>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li><Link to="/" className="hover:text-white transition-colors">Cari Event</Link></li>
            <li><Link to="/register" className="hover:text-white transition-colors">Daftar Sekarang</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Masuk</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm text-white mb-4 uppercase tracking-wider">Organizer</h4>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li><Link to="/register" className="hover:text-white transition-colors">Buat Event</Link></li>
            <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)] mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} SoundWave. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
