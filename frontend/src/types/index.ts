export interface User {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ORGANIZER";
  avatarUrl?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  referralCode?: string;
  referralCode?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  price: number;
  quota: number;
  sold: number;
}

export interface Promotion {
  id: string;
  code?: string | null;
  type: "REFERRAL_VOUCHER" | "DATE_BASED_DISCOUNT";
  discountPercent?: number | null;
  discountAmount?: number | null;
  maxUsage: number;
  usedCount: number;
  startDate: string;
  endDate: string;
}

export interface Review {
  id: string;
  userId: string;
  eventId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl?: string | null };
}

export interface Event {
  id: string;
  organizerId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  city: string;
  imageUrl?: string | null;
  startDate: string;
  endDate: string;
  isFree: boolean;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  totalSeats: number;
  soldSeats: number;
  organizer: { id: string; name: string; avatarUrl?: string | null; bankName?: string | null; bankAccountName?: string | null; bankAccountNumber?: string | null };
  category: Category;
  ticketTypes: TicketType[];
  promotions?: Promotion[];
  reviews?: Review[];
  _count?: { reviews: number };
}

export interface Ticket {
  id: string;
  qrCode: string;
  isUsed: boolean;
  ticketType: TicketType;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  eventId: string;
  baseAmount: number;
  discountAmount: number;
  pointsUsed: number;
  finalAmount: number;
  status: "PENDING" | "WAITING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";
  paymentMethod?: string | null;
  paymentProofUrl?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  paidAt?: string | null;
  createdAt: string;
  event: Event;
  tickets: Ticket[];
  promotion?: Promotion | null;
}

export interface Point {
  id: string;
  amount: number;
  status: "ACTIVE" | "USED" | "EXPIRED";
  source: string;
  expiredAt: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  userId: string;
  code: string;
  discountPercent: number;
  isUsed: boolean;
  expiredAt: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
