export const formatCurrency = (amount: number): string => {
  if (amount === 0) return "GRATIS";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date, opts?: Intl.DateTimeFormatOptions): string => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(new Date(date));
};

export const formatDateShort = (date: string | Date): string =>
  formatDate(date, { day: "2-digit", month: "short", year: "numeric" });

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const formatTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const getAvailableSeats = (total: number, sold: number): number =>
  Math.max(0, total - sold);

export const getSeatPercentage = (total: number, sold: number): number =>
  total === 0 ? 0 : Math.round((sold / total) * 100);

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    PUBLISHED: "badge-green",
    DRAFT: "badge-gray",
    CANCELLED: "badge-red",
    COMPLETED: "badge-gold",
    PAID: "badge-green",
    PENDING: "badge-gold",
    WAITING_PAYMENT: "badge-blue",
    REFUNDED: "badge-gray",
    EXPIRED: "badge-red",
    REJECTED: "badge-red",
  };
  return map[status] ?? "badge-gray";
};

export const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    PUBLISHED: "Dipublikasikan",
    DRAFT: "Draft",
    CANCELLED: "Dibatalkan",
    COMPLETED: "Selesai",
    PAID: "Selesai",              // requirement: "done"
    PENDING: "Menunggu Pembayaran",      // requirement: "waiting for payment"
    WAITING_PAYMENT: "Menunggu Konfirmasi Admin", // requirement: "waiting for admin confirmation"
    REFUNDED: "Dikembalikan",
    EXPIRED: "Kadaluarsa",
    REJECTED: "Ditolak",
  };
  return map[status] ?? status;
};

export const truncate = (str: string, len = 120): string =>
  str.length > len ? str.slice(0, len) + "…" : str;

export const getAxiosError = (err: unknown): string => {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response
  ) {
    const data = err.response.data as { message?: string };
    return data.message ?? "Terjadi kesalahan";
  }
  if (err instanceof Error) return err.message;
  return "Terjadi kesalahan";
};
