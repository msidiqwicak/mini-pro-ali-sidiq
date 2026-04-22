import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { authService } from "../services/auth.service";
import { getAxiosError } from "../utils/helpers";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) { setError("Token tidak valid. Pastikan kamu menggunakan link dari email."); return; }
    if (newPassword.length < 8) { setError("Password minimal 8 karakter"); return; }
    if (newPassword !== confirmPassword) { setError("Konfirmasi password tidak cocok"); return; }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(getAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-(--bg-primary) flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-5xl mb-4">🔗</p>
            <h2 className="text-xl font-semibold text-white mb-2">Link Tidak Valid</h2>
            <p className="text-(--text-muted) mb-6">Token reset password tidak ditemukan.</p>
            <Link to="/forgot-password" className="btn-primary">Minta link baru</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-primary) flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-(--text-muted) hover:text-white mb-8 transition-colors">
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>

          <div className="rounded-2xl bg-(--bg-card) border border-(--border) p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-(--accent-red)/10 border border-(--accent-red)/20 flex items-center justify-center">
                <Lock size={28} className="text-(--accent-red)" />
              </div>
            </div>

            <h1 className="font-display text-2xl text-white text-center mb-2 tracking-wide">RESET PASSWORD</h1>
            <p className="text-sm text-(--text-muted) text-center mb-8">
              Buat password baru untuk akun Anda.
            </p>

            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle size={48} className="mx-auto text-green-400" />
                <p className="text-green-400 font-medium">Password berhasil direset!</p>
                <p className="text-sm text-(--text-muted)">Mengarahkan ke halaman login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="label">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 karakter"
                      className="input-field pr-10"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted)">
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="label">Konfirmasi Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="input-field pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted)">
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? "Mereset Password..." : "Reset Password"}
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

export default ResetPasswordPage;
