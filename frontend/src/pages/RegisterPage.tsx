import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Music2, Eye, EyeOff, Users, Mic2 } from "lucide-react";
import { authService } from "../services/auth.service";
import { useAuth } from "../context/AuthContext";
import { getAxiosError } from "../utils/helpers";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["CUSTOMER", "ORGANIZER"]),
  referralCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "CUSTOMER" },
  });

  const role = watch("role");

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setServerError("");
    try {
      const res = await authService.register({
        ...data,
        referralCode: data.referralCode || undefined,
      });
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
      {/* Left decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[var(--bg-secondary)] items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-64 h-64 bg-[var(--accent-red)] opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-48 h-48 bg-[var(--accent-gold)] opacity-8 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-8">
          <p className="font-display text-[80px] leading-none text-white opacity-5 select-none">♫</p>
          <h2 className="font-display text-4xl text-white tracking-widest mt-2">BERGABUNG</h2>
          <p className="text-[var(--text-muted)] text-sm mt-2 max-w-xs">
            Temukan ribuan event musik terbaik atau jadilah organizer dan mulai jual tiket.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[var(--accent-red)] rounded flex items-center justify-center">
              <Music2 size={18} className="text-white" />
            </div>
            <span className="font-display text-xl tracking-widest text-white">SOUNDWAVE</span>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-1">Buat akun baru</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-[var(--accent-red)] hover:underline">
              Masuk
            </Link>
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(["CUSTOMER", "ORGANIZER"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setValue("role", r)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  role === r
                    ? "border-[var(--accent-red)] bg-[rgba(229,21,43,0.08)]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-hover)]"
                }`}
              >
                {r === "CUSTOMER" ? (
                  <Users size={18} className={role === r ? "text-[var(--accent-red)]" : "text-[var(--text-muted)]"} />
                ) : (
                  <Mic2 size={18} className={role === r ? "text-[var(--accent-red)]" : "text-[var(--text-muted)]"} />
                )}
                <div className="text-left">
                  <p className={`text-sm font-medium ${role === r ? "text-white" : "text-[var(--text-secondary)]"}`}>
                    {r === "CUSTOMER" ? "Penonton" : "Organizer"}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {r === "CUSTOMER" ? "Beli tiket" : "Jual tiket"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {serverError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Nama Lengkap</label>
              <input {...register("name")} placeholder="Nama kamu" className="input-field" />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <input {...register("email")} type="email" placeholder="kamu@email.com" className="input-field" />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 karakter"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {role === "CUSTOMER" && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Kode Referral{" "}
                  <span className="text-[var(--text-muted)] font-normal">(opsional)</span>
                </label>
                <input
                  {...register("referralCode")}
                  placeholder="Masukkan kode referral teman"
                  className="input-field"
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Teman kamu akan mendapat 10.000 poin bonus!
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed !mt-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mendaftarkan...
                </span>
              ) : (
                "Buat Akun"
              )}
            </button>

            <p className="text-center text-xs text-[var(--text-muted)]">
              Dengan mendaftar kamu menyetujui syarat & ketentuan kami.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
