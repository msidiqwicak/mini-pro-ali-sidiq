import { Search, X } from "lucide-react";
import type { ChangeEvent } from "react";

// ─── SearchBar ────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder =  "    Cari event musik...",
}: SearchBarProps) => (
  <div className="relative">
    <Search
      size={16}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
    />
    <input
      type="text"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field pl-10 pr-10"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

// ─── FilterDropdown ───────────────────────────────────────────────
interface FilterDropdownProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
}

export const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
}: FilterDropdownProps) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="input-field cursor-pointer"
  >
    <option value="">{label}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// ─── Pagination ───────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  const items: (number | "…")[] = [];
  let prev = 0;
  for (const p of visible) {
    if (p - prev > 1) items.push("…");
    items.push(p);
    prev = p;
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>

      {items.map((item, i) =>
        item === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-[var(--text-muted)]">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              item === page
                ? "bg-[var(--accent-red)] text-white"
                : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-white"
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>
    </div>
  );
};

// ─── EventCardSkeleton ────────────────────────────────────────────
export const EventCardSkeleton = () => (
  <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
    <div className="skeleton h-48 w-full" />
    <div className="p-5 space-y-3">
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-1.5 w-full rounded-full" />
      <div className="flex justify-between items-center pt-1">
        <div className="skeleton h-5 w-24 rounded" />
        <div className="skeleton h-8 w-8 rounded-full" />
      </div>
    </div>
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────
interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState = ({
  title = "Tidak ada event",
  description = "Coba ubah filter pencarianmu",
  icon,
}: EmptyStateProps) => (
  <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
    <div className="text-6xl mb-4 opacity-20">{icon ?? "🎵"}</div>
    <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">{title}</h3>
    <p className="text-sm text-[var(--text-muted)]">{description}</p>
  </div>
);

// ─── ModalConfirm ─────────────────────────────────────────────────
interface ModalConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmLabel?: string;
  confirmClass?: string;
}

export const ModalConfirm = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = "Konfirmasi",
  confirmClass = "btn-primary",
}: ModalConfirmProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-outline text-sm px-4 py-2">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${confirmClass} text-sm px-4 py-2 disabled:opacity-50`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
