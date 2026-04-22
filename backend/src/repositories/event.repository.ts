import prisma from "../lib/prisma.js";

export const findAllEvents = async (params: {
  search?: string;
  city?: string;
  categoryId?: string;
  page: number;
  limit: number;
}) => {
  const { search, city, categoryId, page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    status: "PUBLISHED" as const,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { city: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(city && { city: { contains: city, mode: "insensitive" as const } }),
    ...(categoryId && { categoryId }),
  };

  // Fetch all matching events (no orderBy — we sort manually below)
  const allEvents = await prisma.event.findMany({
    where,
    include: {
      organizer: { select: { id: true, name: true, avatarUrl: true } },
      category: true,
      ticketTypes: true,
      _count: { select: { reviews: true } },
    },
  });

  const now = new Date();

  // Split into upcoming (endDate >= now) and expired (endDate < now)
  const upcoming = allEvents
    .filter((e) => new Date(e.endDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const expired = allEvents
    .filter((e) => new Date(e.endDate) < now)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  // Merge: upcoming first (closest date first), expired last (most recent first)
  const sorted = [...upcoming, ...expired];

  const total = sorted.length;
  const events = sorted.slice(skip, skip + limit);

  return { events, total };
};


export const findEventBySlug = async (slug: string) => {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      organizer: { select: { id: true, name: true, avatarUrl: true } },
      category: true,
      ticketTypes: true,
      promotions: {
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      },
      reviews: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  });
};

export const findEventById = async (id: string) => {
  return prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      category: true,
      ticketTypes: true,
      promotions: true,
      transactions: true,
    },
  });
};

export const findEventsByOrganizer = async (organizerId: string) => {
  return prisma.event.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      ticketTypes: true,
      _count: { select: { reviews: true, transactions: true } },
    },
  });
};

export const createEvent = async (data: {
  organizerId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  city: string;
  imageUrl?: string;
  startDate: Date;
  endDate: Date;
  isFree: boolean;
  totalSeats: number;
  status?: "DRAFT" | "PUBLISHED";
}) => {
  return prisma.event.create({ data, include: { category: true, ticketTypes: true } });
};

export const updateEvent = async (
  id: string,
  data: Partial<{
    name: string;
    description: string;
    location: string;
    city: string;
    imageUrl: string;
    startDate: Date;
    endDate: Date;
    isFree: boolean;
    totalSeats: number;
    status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
    categoryId: string;
  }>
) => {
  return prisma.event.update({ where: { id }, data });
};

export const deleteEvent = async (id: string) => {
  return prisma.event.delete({ where: { id } });
};

export const createTicketTypes = async (
  ticketTypes: Array<{
    eventId: string;
    name: string;
    description?: string;
    price: number;
    quota: number;
  }>
) => {
  return prisma.ticketType.createMany({ data: ticketTypes });
};

export const findAllCities = async () => {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return events.map((e) => e.city);
};

export const findAllCategories = async () => {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
};

export const createPromotions = async (
  promotions: Array<{
    eventId: string;
    code?: string;
    type: "DATE_BASED_DISCOUNT" | "REFERRAL_VOUCHER";
    discountPercent?: number;
    discountAmount?: number;
    maxUsage: number;
    startDate: Date;
    endDate: Date;
  }>
) => {
  return prisma.promotion.createMany({ data: promotions });
};
