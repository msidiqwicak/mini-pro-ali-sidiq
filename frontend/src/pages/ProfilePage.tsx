import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Shield,
  Gift,
  Star,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit3,
  Coins,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Camera,
  Loader2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { authService } from "../services/auth.service";
import { uploadImage } from "../services/upload.service";
import { useAuth } from "../context/AuthContext";
import { getAxiosError } from "../utils/helpers";
import type { Point, Coupon } from "../types";

// ─── Schemas ──────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  avatarUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID").format(n);

// ─── Component ───────────────────────────────────────────────────────────────
type Tab = "profile" | "points" | "coupons" | "security";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Points & Coupons state
  const [points, setPoints] = useState<Point[]>([]);
  const [pointTotal, setPointTotal] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Copy referral state
  const [copied, setCopied] = useState(false);

  // Profile save state
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ─── Load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setDataLoading(true);
      try {
        const [ptRes, cpRes] = await Promise.all([
          authService.getPoints(),
          authService.getCoupons(),
        ]);
        setPoints(ptRes.data.points);
        setPointTotal(ptRes.data.total);
        setCoupons(cpRes.data.coupons);
      } catch {
        /* ignore */
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, []);

  // ─── Profile form ─────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? "" },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await authService.updateProfile({
        name: data.name,
        avatarUrl: data.avatarUrl || undefined,
      });
      updateUser(res.data);
      setProfileMsg({ type: "success", text: "Profil berhasil diperbarui!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: getAxiosError(err) });
    } finally {
      setProfileSaving(false);
    }
  };

  // ─── Password form ────────────────────────────────────────────────────────
  const pwForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPwSaving(true);
    setPwMsg(null);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      pwForm.reset();
      setPwMsg({ type: "success", text: "Password berhasil diubah!" });
    } catch (err) {
      setPwMsg({ type: "error", text: getAxiosError(err) });
    } finally {
      setPwSaving(false);
    }
  };

  // ─── Copy Referral ────────────────────────────────────────────────────────
  const copyReferral = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Avatar Upload ────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setProfileMsg(null);
    try {
      const url = await uploadImage(file, "avatars");
      profileForm.setValue("avatarUrl", url);
      const res = await authService.updateProfile({ avatarUrl: url });
      updateUser(res.data);
      setProfileMsg({ type: "success", text: "Foto profil berhasil diperbarui!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: getAxiosError(err) });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // ─── Tabs config ──────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profil", icon: <User size={16} /> },
    { id: "points", label: `Poin (${fmtIDR(pointTotal)})`, icon: <Coins size={16} /> },
    { id: "coupons", label: `Kupon (${coupons.length})`, icon: <Ticket size={16} /> },
    { id: "security", label: "Keamanan", icon: <Shield size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          {/* Clickable avatar with upload overlay */}
          <div
            className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-elevated)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0 cursor-pointer group"
            onClick={() => !avatarUploading && avatarInputRef.current?.click()}
            title="Klik untuk ganti foto profil"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-[var(--text-muted)]" />
            )}
            {/* Hover / loading overlay */}
            <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
              avatarUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              {avatarUploading
                ? <Loader2 size={18} className="text-white animate-spin" />
                : <Camera size={18} className="text-white" />}
            </div>
          </div>
          {/* Hidden file input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--accent-red)]/20 text-[var(--accent-red)]">
              {user?.role === "ORGANIZER" ? "Organizer" : "Customer"}
            </span>
            <p className="text-xs text-[var(--text-muted)] mt-1">Klik foto untuk mengganti</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`profile-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-[var(--accent-red)] text-white"
                  : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════ TAB: PROFIL ══════════════════ */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Referral Code Card */}
            {user?.referralCode && (
              <div className="rounded-xl bg-gradient-to-r from-[var(--accent-red)]/10 to-[var(--accent-gold)]/10 border border-[var(--accent-red)]/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Gift size={18} className="text-[var(--accent-red)]" />
                  <span className="text-sm font-semibold text-white">Kode Referral Kamu</span>
                </div>
                <div className="flex items-center gap-3">
                  <code
                    id="referral-code-display"
                    className="flex-1 font-mono text-lg font-bold text-white bg-[var(--bg-elevated)] rounded-lg px-4 py-2 tracking-widest border border-[var(--border)]"
                  >
                    {user.referralCode}
                  </code>
                  <button
                    id="copy-referral-btn"
                    onClick={copyReferral}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-red)] text-white text-sm font-medium hover:opacity-90 transition-all"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? "Disalin!" : "Salin"}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Bagikan kode ini ke teman. Setiap teman yang mendaftar menggunakan kode kamu, kamu akan mendapat <strong className="text-white">10.000 poin</strong>!
                </p>
              </div>
            )}

            {/* Profile Form */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Edit3 size={16} className="text-[var(--accent-red)]" />
                <h2 className="text-base font-semibold text-white">Edit Profil</h2>
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${
                  profileMsg.type === "success"
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}>
                  {profileMsg.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    id="profile-name-input"
                    {...profileForm.register("name")}
                    className="input-field"
                    placeholder="Nama kamu"
                  />
                  {profileForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-400">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>

                {/* avatarUrl hidden — diisi otomatis saat upload gambar */}
                <input type="hidden" {...profileForm.register("avatarUrl")} />

                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={profileSaving}
                  className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB: POIN ══════════════════ */}
        {activeTab === "points" && (
          <div className="space-y-4">
            {/* Total balance card */}
            <div className="rounded-xl bg-gradient-to-r from-[var(--accent-red)]/10 to-purple-500/10 border border-[var(--accent-red)]/20 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Star size={18} className="text-[var(--accent-gold)]" />
                <span className="text-sm text-[var(--text-muted)]">Total Poin Aktif</span>
              </div>
              <p id="points-total" className="text-4xl font-bold text-white font-display">
                {fmtIDR(pointTotal)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Gunakan poin untuk diskon pembelian tiket
              </p>
            </div>

            {/* Points list */}
            {dataLoading ? (
              <div className="text-center py-10 text-[var(--text-muted)]">Memuat data...</div>
            ) : points.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Coins size={40} className="mx-auto mb-3 opacity-30" />
                <p>Belum ada poin. Bagikan kode referral kamu!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {points.map((pt) => (
                  <div
                    key={pt.id}
                    className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{pt.source}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Berlaku sampai{" "}
                        <span className="text-[var(--accent-gold)]">{fmt(pt.expiredAt)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[var(--accent-gold)]">
                        +{fmtIDR(pt.amount)}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">
                        {pt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ TAB: KUPON ══════════════════ */}
        {activeTab === "coupons" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Ticket size={18} className="text-[var(--accent-red)]" />
              <h2 className="text-base font-semibold text-white">Kupon Diskon Kamu</h2>
            </div>

            {dataLoading ? (
              <div className="text-center py-10 text-[var(--text-muted)]">Memuat data...</div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Ticket size={40} className="mx-auto mb-3 opacity-30" />
                <p>Belum ada kupon. Daftar menggunakan kode referral teman untuk mendapatkan diskon!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coupons.map((cp) => {
                  const isExpired = new Date(cp.expiredAt) < new Date();
                  const isAvailable = !cp.isUsed && !isExpired;
                  return (
                    <div
                      key={cp.id}
                      className={`relative overflow-hidden rounded-xl border px-5 py-4 ${
                        isAvailable
                          ? "bg-[var(--bg-card)] border-[var(--accent-red)]/30"
                          : "bg-[var(--bg-secondary)] border-[var(--border)] opacity-60"
                      }`}
                    >
                      {/* Left accent */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAvailable ? "bg-[var(--accent-red)]" : "bg-gray-600"}`} />

                      <div className="flex items-center justify-between pl-2">
                        <div>
                          <code
                            id={`coupon-code-${cp.id}`}
                            className="font-mono text-lg font-bold text-white tracking-widest"
                          >
                            {cp.code}
                          </code>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Berlaku sampai{" "}
                            <span className={isExpired ? "text-red-400" : "text-[var(--accent-gold)]"}>
                              {fmt(cp.expiredAt)}
                            </span>
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="text-2xl font-bold text-[var(--accent-red)]">
                            {cp.discountPercent}%
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            cp.isUsed
                              ? "bg-gray-500/20 text-gray-400"
                              : isExpired
                              ? "bg-red-500/15 text-red-400"
                              : "bg-green-500/15 text-green-400"
                          }`}>
                            {cp.isUsed ? "Sudah digunakan" : isExpired ? "Kadaluarsa" : "Tersedia"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-[var(--text-muted)] text-center pt-2">
              Masukkan kode kupon saat checkout untuk mendapatkan diskon
            </p>
          </div>
        )}

        {/* ══════════════════ TAB: KEAMANAN ══════════════════ */}
        {activeTab === "security" && (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield size={16} className="text-[var(--accent-red)]" />
              <h2 className="text-base font-semibold text-white">Ubah Password</h2>
            </div>

            {pwMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${
                pwMsg.type === "success"
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {pwMsg.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Password Lama
                </label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    {...pwForm.register("currentPassword")}
                    type={showCurrent ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="Password saat ini"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-xs text-red-400">{pwForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    {...pwForm.register("newPassword")}
                    type={showNew ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="Min. 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwForm.formState.errors.newPassword && (
                  <p className="mt-1 text-xs text-red-400">{pwForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    id="confirm-password-input"
                    {...pwForm.register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="Ulangi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{pwForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                id="change-password-btn"
                type="submit"
                disabled={pwSaving}
                className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwSaving ? "Mengubah..." : "Ubah Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
