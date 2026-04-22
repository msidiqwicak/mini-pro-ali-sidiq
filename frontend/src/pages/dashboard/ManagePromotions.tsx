import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Tag, CalendarDays, ChevronDown, TicketPercent } from "lucide-react";
import { eventService } from "../../services/event.service";
import { ModalConfirm } from "../../components/UIComponents";
import api from "../../services/api";
import type { ApiResponse, Event } from "../../types";
import { formatDate, formatCurrency, getAxiosError } from "../../utils/helpers";

interface Promotion {
  id: string;
  eventId: string;
  code: string;
  type: "REFERRAL_VOUCHER" | "DATE_BASED_DISCOUNT";
  discountPercent?: number | null;
  discountAmount?: number | null;
  maxUsage: number;
  usedCount: number;
  startDate: string;
  endDate: string;
}

const ManagePromotions = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"DATE_BASED_DISCOUNT" | "REFERRAL_VOUCHER">("DATE_BASED_DISCOUNT");
  const [formDiscountType, setFormDiscountType] = useState<"percent" | "amount">("percent");
  const [formDiscount, setFormDiscount] = useState("");
  const [formMaxUsage, setFormMaxUsage] = useState("50");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    eventService.getOrganizerEvents().then((r) => {
      const evs = r.data as Event[];
      setEvents(evs);
      if (evs.length > 0) setSelectedEventId(evs[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoadingPromos(true);
    api.get<ApiResponse<Promotion[]>>(`/events/${selectedEventId}/promotions`)
      .then((r) => setPromos(r.data.data ?? []))
      .catch(() => setPromos([]))
      .finally(() => setLoadingPromos(false));
  }, [selectedEventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    if (!selectedEventId) { setFormError("Pilih event terlebih dahulu"); return; }
    if (!formCode.trim()) { setFormError("Kode promo wajib diisi"); return; }
    if (!formDiscount || Number(formDiscount) <= 0) { setFormError("Nilai diskon wajib diisi"); return; }
    if (!formStartDate || !formEndDate) { setFormError("Periode wajib diisi"); return; }

    const body: Record<string, unknown> = {
      code: formCode.trim().toUpperCase(),
      type: formType,
      maxUsage: Number(formMaxUsage),
      startDate: formStartDate,
      endDate: formEndDate,
    };
    if (formDiscountType === "percent") body.discountPercent = Number(formDiscount);
    else body.discountAmount = Number(formDiscount);

    setFormLoading(true);
    try {
      const res = await api.post<ApiResponse<Promotion>>(`/events/${selectedEventId}/promotions`, body);
      setPromos((prev) => [res.data.data, ...prev]);
      setFormCode(""); setFormDiscount(""); setFormStartDate(""); setFormEndDate("");
      setSuccess("Promosi berhasil dibuat!");
    } catch (err) {
      setFormError(getAxiosError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/events/${selectedEventId}/promotions/${deletingId}`);
      setPromos((prev) => prev.filter((p) => p.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      setError(getAxiosError(err));
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">KELOLA PROMOSI</h1>
          <p className="text-sm text-(--text-muted) mt-1">Buat dan kelola voucher promo per event</p>
        </div>
      </div>

      {/* Event Selector */}
      <div className="relative">
        <label className="block text-xs text-(--text-muted) uppercase tracking-wider mb-1.5">Pilih Event</label>
        <div className="relative">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="input-field appearance-none pr-10 w-full sm:w-80"
          >
            {events.length === 0 && <option value="">Belum ada event</option>}
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />
        </div>
      </div>

      {/* Create Form */}
      <div className="rounded-xl bg-(--bg-card) border border-(--border) p-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Plus size={16} className="text-(--accent-red)" /> Buat Promo Baru
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Code */}
          <div>
            <label className="label">Kode Promo</label>
            <input value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} placeholder="mis. SOUNDWAVE50" className="input-field" maxLength={20} />
          </div>
          {/* Type */}
          <div>
            <label className="label">Tipe Promo</label>
            <div className="relative">
              <select value={formType} onChange={(e) => setFormType(e.target.value as typeof formType)} className="input-field appearance-none pr-8 w-full">
                <option value="DATE_BASED_DISCOUNT">Diskon Berbasis Tanggal</option>
                <option value="REFERRAL_VOUCHER">Voucher Referral</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />
            </div>
          </div>
          {/* Discount value */}
          <div>
            <label className="label">Nilai Diskon</label>
            <div className="flex gap-2">
              <div className="relative">
                <select value={formDiscountType} onChange={(e) => setFormDiscountType(e.target.value as typeof formDiscountType)} className="input-field appearance-none pr-7 text-xs">
                  <option value="percent">%</option>
                  <option value="amount">IDR</option>
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />
              </div>
              <input type="number" value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} placeholder={formDiscountType === "percent" ? "10" : "50000"} className="input-field flex-1" min={1} max={formDiscountType === "percent" ? 100 : undefined} />
            </div>
          </div>
          {/* Max usage */}
          <div>
            <label className="label">Maks. Penggunaan</label>
            <input type="number" value={formMaxUsage} onChange={(e) => setFormMaxUsage(e.target.value)} className="input-field" min={1} />
          </div>
          {/* Start date */}
          <div>
            <label className="label">Tanggal Mulai</label>
            <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="input-field" />
          </div>
          {/* End date */}
          <div>
            <label className="label">Tanggal Selesai</label>
            <input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} className="input-field" />
          </div>

          {/* Errors & Submit */}
          {formError && <p className="sm:col-span-2 lg:col-span-3 text-red-400 text-sm">{formError}</p>}
          {success && <p className="sm:col-span-2 lg:col-span-3 text-green-400 text-sm">✅ {success}</p>}
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={formLoading || !selectedEventId} className="btn-primary disabled:opacity-50">
              {formLoading ? "Membuat..." : "Buat Promosi"}
            </button>
          </div>
        </form>
      </div>

      {/* Promotions Table */}
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      <div className="rounded-xl bg-(--bg-card) border border-(--border) overflow-hidden">
        <div className="px-5 py-3 border-b border-(--border) bg-(--bg-elevated) flex items-center gap-2">
          <TicketPercent size={14} className="text-(--accent-red)" />
          <span className="text-sm font-medium text-white">Daftar Promosi ({promos.length})</span>
        </div>
        {loadingPromos ? (
          <div className="p-6 space-y-3">{[1, 2].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
        ) : promos.length === 0 ? (
          <div className="text-center py-12">
            <Tag size={32} className="mx-auto mb-3 text-(--text-muted) opacity-20" />
            <p className="text-sm text-(--text-muted)">Belum ada promosi untuk event ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-(--border) text-xs text-(--text-muted) uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Kode</th>
                  <th className="text-left px-4 py-3">Tipe</th>
                  <th className="text-left px-4 py-3">Diskon</th>
                  <th className="text-left px-4 py-3">Periode</th>
                  <th className="text-left px-4 py-3">Pakai</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {promos.map((p) => {
                  const expired = new Date(p.endDate) < now;
                  return (
                    <tr key={p.id} className={`hover:bg-(--bg-elevated) transition-colors ${expired ? "opacity-50" : ""}`}>
                      <td className="px-5 py-3 font-mono text-sm text-white">{p.code}</td>
                      <td className="px-4 py-3 text-xs text-(--text-muted)">{p.type === "REFERRAL_VOUCHER" ? "Referral" : "Tanggal"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-(--accent-red)">
                        {p.discountPercent ? `${p.discountPercent}%` : p.discountAmount ? formatCurrency(p.discountAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-(--text-muted) whitespace-nowrap">
                        {formatDate(p.startDate)} — {formatDate(p.endDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-(--text-secondary)">{p.usedCount}/{p.maxUsage}</td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <span className="badge badge-gray text-[10px]">Kadaluarsa</span>
                        ) : (
                          <span className="badge badge-green text-[10px]">Aktif</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setDeletingId(p.id)}
                          disabled={p.usedCount > 0}
                          title={p.usedCount > 0 ? "Tidak dapat dihapus (sudah digunakan)" : "Hapus"}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-(--border) text-(--text-secondary) hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-auto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalConfirm
        isOpen={!!deletingId}
        title="Hapus Promosi"
        message="Yakin ingin menghapus promosi ini? Tindakan tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        loading={deleteLoading}
        confirmLabel="Ya, Hapus"
        confirmClass="bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
      />
    </div>
  );
};

export default ManagePromotions;
