import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Music2, Eye, EyeOff, AlertCircle, Clock } from "lucide-react";
import { authService } from "../services/auth.service";
import { useAuth } from "../context/AuthContext";
import { getAxiosError } from "../utils/helpers";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type FormData = z.infer<typeof schema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0); // seconds remaining

  // Countdown timer when locked out
  useEffect(() => {
    if (lockCountdown <= 0) return;
    const timer = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setServerError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockCountdown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (lockCountdown > 0) return;
    setIsLoading(true);
    setServerError("");
    try {
      const res = await authService.login(data);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === "ORGANIZER" ? "/dashboard" : "/");
    } catch (err) {
      const msg = getAxiosError(err);
      setServerError(msg);
      // Only start countdown when account is fully locked (5-minute lockout message)
      if (msg.includes("selama 5 menit") || msg.includes("Coba lagi dalam")) {
        setLockCountdown(5 * 60);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-primary) flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-(--bg-secondary) items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-(--accent-red) opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-(--accent-gold) opacity-8 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center">
          <div className="font-display text-[120px] leading-none text-white opacity-5 select-none">♪</div>
          <h2 className="font-display text-5xl text-white tracking-widest mt-4">SOUNDWAVE</h2>
          <p className="text-(--text-muted) mt-3 text-sm">Platform Event Musik #1 Indonesia</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-(--accent-red) rounded flex items-center justify-center">
              <Music2 size={18} className="text-white" />
            </div>
            <span className="font-display text-xl tracking-widest text-white">SOUNDWAVE</span>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-1">Selamat datang kembali</h1>
          <p className="text-sm text-(--text-muted) mb-8">
            Belum punya akun?{" "}
            <Link to="/register" className="text-(--accent-red) hover:underline">
              Daftar sekarang
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error banner */}
            {serverError && (
              <div className={`p-3.5 rounded-xl border text-sm flex items-start gap-3 ${
                lockCountdown > 0
                  ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                {lockCountdown > 0 ? (
                  <Clock size={16} className="shrink-0 mt-0.5 text-orange-400" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                )}
                <div>
                  <p className="font-medium">{serverError}</p>
                  {lockCountdown > 0 && (
                    <p className="text-xs mt-1 text-orange-400/80">
                      Tersisa: {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, "0")}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="kamu@email.com"
                className="input-field"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-white"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-(--text-muted) hover:text-(--accent-red) transition-colors">
                  Lupa Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || lockCountdown > 0}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lockCountdown > 0 ? (
                <span className="flex items-center gap-2">
                  <Clock size={16} className="animate-pulse" />
                  Tunggu {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, "0")}
                </span>
              ) : isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl bg-(--bg-card) border border-(--border)">
            <p className="text-xs font-medium text-(--text-muted) mb-2 uppercase tracking-wider">Demo Credentials</p>
            <div className="space-y-1 text-xs text-(--text-secondary)">
              <p>🎤 Organizer: <code className="text-(--accent-gold)">organizer@soundwave.com</code> / password123</p>
              <p>🎫 Customer: <code className="text-(--accent-gold)">customer@gmail.com</code> / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
