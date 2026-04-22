import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { authService } from "../services/auth.service";
import { getAxiosError } from "../utils/helpers";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email wajib diisi"); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-primary) flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-(--text-muted) hover:text-white mb-8 transition-colors">
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>

          <div className="rounded-2xl bg-(--bg-card) border border-(--border) p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-(--accent-red)/10 border border-(--accent-red)/20 flex items-center justify-center">
                <Mail size={28} className="text-(--accent-red)" />
              </div>
            </div>

            <h1 className="font-display text-2xl text-white text-center mb-2 tracking-wide">LUPA PASSWORD?</h1>
            <p className="text-sm text-(--text-muted) text-center mb-8">
              Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
            </p>

            {sent ? (
              <div className="text-center space-y-4">
                <div className="text-5xl mb-2">📬</div>
                <p className="text-green-400 font-medium">Link reset telah dikirim!</p>
                <p className="text-sm text-(--text-muted)">
                  Periksa inbox email <strong className="text-white">{email}</strong>.<br />
                  Link berlaku selama 15 menit.
                </p>
                <Link to="/login" className="btn-primary mt-4 inline-block">
                  Kembali ke Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Alamat Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="input-field"
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? (
                    <>Mengirim...</>
                  ) : (
                    <><Send size={14} /> Kirim Link Reset</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
