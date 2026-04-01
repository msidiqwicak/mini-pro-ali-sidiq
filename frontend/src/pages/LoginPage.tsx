import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Music2, Eye, EyeOff } from "lucide-react";
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setServerError("");
    try {
      const res = await authService.login(data);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === "ORGANIZER" ? "/dashboard" : "/");
    } catch (err) {
      setServerError(getAxiosError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[var(--bg-secondary)] items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-[var(--accent-red)] opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-[var(--accent-gold)] opacity-8 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center">
          <div className="font-display text-[120px] leading-none text-white opacity-5 select-none">♪</div>
          <h2 className="font-display text-5xl text-white tracking-widest mt-4">SOUNDWAVE</h2>
          <p className="text-[var(--text-muted)] mt-3 text-sm">Platform Event Musik #1 Indonesia</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-[var(--accent-red)] rounded flex items-center justify-center">
              <Music2 size={18} className="text-white" />
            </div>
            <span className="font-display text-xl tracking-widest text-white">SOUNDWAVE</span>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-1">Selamat datang kembali</h1>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Belum punya akun?{" "}
            <Link to="/register" className="text-[var(--accent-red)] hover:underline">
              Daftar sekarang
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {serverError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
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
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
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
          <div className="mt-8 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Demo Credentials</p>
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <p>🎤 Organizer: <code className="text-[var(--accent-gold)]">organizer@soundwave.com</code> / password123</p>
              <p>🎫 Customer: <code className="text-[var(--accent-gold)]">customer@gmail.com</code> / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
