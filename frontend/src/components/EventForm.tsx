import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { eventService } from "../services/event.service";
import type { Category } from "../types";

const schema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  categoryId: z.string().min(1, "Pilih kategori"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  location: z.string().min(3, "Lokasi wajib diisi"),
  city: z.string().min(2, "Kota wajib diisi"),
  imageUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  isFree: z.boolean(),
  totalSeats: z.coerce.number().int().positive("Harus positif"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  ticketTypes: z.array(z.object({
    name: z.string().min(1, "Nama tiket wajib diisi"),
    description: z.string().optional(),
    price: z.coerce.number().int().min(0),
    quota: z.coerce.number().int().positive("Kuota harus positif"),
  })).min(1, "Minimal 1 tipe tiket"),
  promotions: z.array(z.object({
    code: z.string().min(3, "Kode promo minimal 3 karakter").toUpperCase(),
    discountPercent: z.coerce.number().int().min(1, "Minimal 1%").max(100, "Maksimal 100%"),
    maxUsage: z.coerce.number().int().min(1, "Minimal 1"),
    startDate: z.string().min(1, "Wajib diisi"),
    endDate: z.string().min(1, "Wajib diisi"),
  })).optional(),
});

export type EventFormData = z.infer<typeof schema>;

interface EventFormProps {
  defaultValues?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  serverError?: string;
  showTicketTypes?: boolean;
}

const EventForm = ({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Simpan Event",
  serverError,
  showTicketTypes = true,
}: EventFormProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    eventService.getCategories().then((r) => setCategories(r.data ?? [])).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "DRAFT",
      isFree: false,
      ticketTypes: [{ name: "REGULER", description: "", price: 0, quota: 100 }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "ticketTypes" });
  const { fields: promoFields, append: appendPromo, remove: removePromo } = useFieldArray({ control, name: "promotions" });
  const isFree = watch("isFree");

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {serverError}
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-5">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Informasi Dasar</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Nama Event *" error={errors.name?.message}>
            <input {...register("name")} placeholder="Nama event musik kamu" className="input-field" />
          </Field>
          <Field label="Kategori *" error={errors.categoryId?.message}>
            <select {...register("categoryId")} className="input-field cursor-pointer">
              <option value="">Pilih Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Deskripsi *" error={errors.description?.message}>
          <textarea
            {...register("description")}
            rows={5}
            placeholder="Ceritakan tentang event ini..."
            className="input-field resize-none"
          />
        </Field>

        <Field label="URL Gambar" error={errors.imageUrl?.message}>
          <input {...register("imageUrl")} placeholder="https://..." className="input-field" />
        </Field>
      </div>

      {/* Location & Date */}
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-5">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Lokasi & Waktu</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Lokasi / Venue *" error={errors.location?.message}>
            <input {...register("location")} placeholder="Nama venue / gedung" className="input-field" />
          </Field>
          <Field label="Kota *" error={errors.city?.message}>
            <input {...register("city")} placeholder="Jakarta, Bandung, dll." className="input-field" />
          </Field>
          <Field label="Tanggal Mulai *" error={errors.startDate?.message}>
            <input {...register("startDate")} type="datetime-local" className="input-field" />
          </Field>
          <Field label="Tanggal Selesai *" error={errors.endDate?.message}>
            <input {...register("endDate")} type="datetime-local" className="input-field" />
          </Field>
        </div>
      </div>

      {/* Capacity & Status */}
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-5">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Kapasitas & Status</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Field label="Total Kursi *" error={errors.totalSeats?.message}>
            <input {...register("totalSeats")} type="number" min={1} className="input-field" />
          </Field>
          <Field label="Status *" error={errors.status?.message}>
            <select {...register("status")} className="input-field cursor-pointer">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Publish</option>
            </select>
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input {...register("isFree")} type="checkbox" className="sr-only peer" />
                <div className="w-10 h-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full peer-checked:bg-[var(--accent-red)] transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Event Gratis</span>
            </label>
          </div>
        </div>
      </div>

      {/* Ticket Types */}
      {showTicketTypes && (
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Tipe Tiket</h3>
            <button
              type="button"
              onClick={() => append({ name: "", description: "", price: 0, quota: 100 })}
              className="flex items-center gap-1.5 text-xs text-[var(--accent-red)] hover:opacity-80"
            >
              <Plus size={13} /> Tambah Tipe
            </button>
          </div>

          {errors.ticketTypes?.root && (
            <p className="text-xs text-red-400">{errors.ticketTypes.root.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="relative p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]"
              >
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Nama Tiket *</label>
                    <input
                      {...register(`ticketTypes.${idx}.name`)}
                      placeholder="VIP, REGULER, dll."
                      className="input-field text-sm"
                    />
                    {errors.ticketTypes?.[idx]?.name && (
                      <p className="mt-1 text-xs text-red-400">{errors.ticketTypes[idx]?.name?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">
                      Harga (Rp) {isFree && <span className="text-[var(--text-muted)]">(0 = gratis)</span>}
                    </label>
                    <input
                      {...register(`ticketTypes.${idx}.price`)}
                      type="number"
                      min={0}
                      placeholder="0"
                      className="input-field text-sm"
                      disabled={isFree}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Kuota *</label>
                    <input
                      {...register(`ticketTypes.${idx}.quota`)}
                      type="number"
                      min={1}
                      className="input-field text-sm"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Deskripsi (opsional)</label>
                    <input
                      {...register(`ticketTypes.${idx}.description`)}
                      placeholder="Fasilitas yang didapat..."
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promotions / Voucher Discount */}
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Voucher Diskon</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Voucher diskon khusus untuk event ini (opsional)</p>
          </div>
          <button
            type="button"
            onClick={() => appendPromo({ code: "", discountPercent: 10, maxUsage: 100, startDate: "", endDate: "" })}
            className="flex items-center gap-1.5 text-xs text-[var(--accent-red)] hover:opacity-80"
          >
            <Plus size={13} /> Tambah Voucher
          </button>
        </div>

        {errors.promotions?.root && (
          <p className="text-xs text-red-400">{errors.promotions.root.message}</p>
        )}

        <div className="space-y-4">
          {promoFields.map((field, idx) => (
            <div
              key={field.id}
              className="relative p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]"
            >
              <button
                type="button"
                onClick={() => removePromo(idx)}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors z-10"
              >
                <Trash2 size={12} />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Kode Voucher *</label>
                  <input
                    {...register(`promotions.${idx}.code`)}
                    placeholder="Contoh: SUMMER2026"
                    className="input-field text-sm uppercase"
                  />
                  {errors.promotions?.[idx]?.code && (
                    <p className="mt-1 text-xs text-red-400">{errors.promotions[idx]?.code?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Diskon (%) *</label>
                  <input
                    {...register(`promotions.${idx}.discountPercent`)}
                    type="number"
                    min={1}
                    max={100}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Kuota Pakai *</label>
                  <input
                    {...register(`promotions.${idx}.maxUsage`)}
                    type="number"
                    min={1}
                    className="input-field text-sm"
                  />
                </div>
                <div className="sm:col-span-1" />

                <div className="sm:col-span-2">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Mulai Berlaku *</label>
                  <input
                    {...register(`promotions.${idx}.startDate`)}
                    type="datetime-local"
                    className="input-field text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Selesai Berlaku *</label>
                  <input
                    {...register(`promotions.${idx}.endDate`)}
                    type="datetime-local"
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          {promoFields.length === 0 && (
            <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--text-muted)]">
              Belum ada voucher diskon. Klik "Tambah Voucher" untuk membuat.
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full sm:w-auto justify-center py-3 px-8 text-base disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Menyimpan...
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
};

export default EventForm;
