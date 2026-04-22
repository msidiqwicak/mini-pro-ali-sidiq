import { z } from "zod";
import {
  findAllEvents,
  findEventBySlug,
  findEventById,
  findEventsByOrganizer,
  createEvent,
  updateEvent,
  deleteEvent,
  createTicketTypes,
  createPromotions,
  findAllCities,
  findAllCategories,
} from "../repositories/event.repository.js";
import { generateSlug } from "../utils/slug.js";
import {
  getOrSetCache,
  deleteCache,
  clearCachePattern,
} from "../utils/cacheManager.js";
import { REDIS_KEYS, REDIS_TTL } from "../utils/redisKeys.js";

export const createEventSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  name: z.string().min(3, "Nama event minimal 3 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  location: z.string().min(3, "Lokasi wajib diisi"),
  city: z.string().min(2, "Kota wajib diisi"),
  imageUrl: z.string().url("URL gambar tidak valid").optional().or(z.literal("")),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi").refine((v) => !isNaN(Date.parse(v)), "Format tanggal tidak valid"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi").refine((v) => !isNaN(Date.parse(v)), "Format tanggal tidak valid"),
  isFree: z.boolean().default(false),
  totalSeats: z.number().int().positive("Jumlah kursi harus positif"),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  ticketTypes: z
    .array(
      z.object({
        name: z.string().min(1, "Nama tiket wajib diisi"),
        description: z.string().optional(),
        price: z.number().int().min(0, "Harga tidak boleh negatif"),
        quota: z.number().int().positive("Kuota harus positif"),
      })
    )
    .min(1, "Minimal 1 tipe tiket"),
  promotions: z
    .array(
      z.object({
        code: z.string().min(3, "Kode promo minimal 3 karakter").toUpperCase(),
        discountPercent: z.number().int().min(1, "Diskon minimal 1%").max(100, "Diskon maksimal 100%"),
        maxUsage: z.number().int().min(1, "Batas penggunaan minimal 1"),
        startDate: z.string().min(1, "Tanggal mulai promo wajib diisi").refine((v) => !isNaN(Date.parse(v)), "Format tanggal invalid"),
        endDate: z.string().min(1, "Tanggal akhir promo wajib diisi").refine((v) => !isNaN(Date.parse(v)), "Format tanggal invalid"),
      })
    )
    .optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial().omit({ ticketTypes: true });
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const getEventsService = async (params: {
  search?: string;
  city?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}) => {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(20, Math.max(1, params.limit ?? 9));

  // Buat cache key unik berdasarkan semua filter & pagination
  const filterKey = JSON.stringify({ search: params.search, city: params.city, categoryId: params.categoryId, page, limit });
  const cacheKey = REDIS_KEYS.CACHE_EVENTS(filterKey);

  return getOrSetCache(
    cacheKey,
    async () => {
      const { events, total } = await findAllEvents({
        search: params.search,
        city: params.city,
        categoryId: params.categoryId,
        page,
        limit,
      });
      return {
        data: events,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
    REDIS_TTL.MEDIUM // 5 menit
  );
};

export const getEventBySlugService = async (slug: string) => {
  const cacheKey = REDIS_KEYS.CACHE_EVENT_BY_SLUG(slug);

  const event = await getOrSetCache(
    cacheKey,
    () => findEventBySlug(slug),
    REDIS_TTL.MEDIUM // 5 menit
  );

  if (!event) throw new Error("Event tidak ditemukan");
  return event;
};

export const createEventService = async (
  organizerId: string,
  input: CreateEventInput
) => {
  const slug = generateSlug(input.name);
  const { ticketTypes, promotions, ...eventData } = input;

  const event = await createEvent({
    organizerId,
    ...eventData,
    slug,
    imageUrl: eventData.imageUrl ?? undefined,
    startDate: new Date(eventData.startDate),
    endDate: new Date(eventData.endDate),
  });

  if (ticketTypes.length > 0) {
    await createTicketTypes(
      ticketTypes.map((tt) => ({ ...tt, eventId: event.id }))
    );
  }

  if (promotions && promotions.length > 0) {
    await createPromotions(
      promotions.map((p) => ({
        eventId: event.id,
        code: p.code,
        type: "DATE_BASED_DISCOUNT",
        discountPercent: p.discountPercent,
        maxUsage: p.maxUsage,
        startDate: new Date(p.startDate),
        endDate: new Date(p.endDate),
      }))
    );
  }

  // Invalidate semua cache list events agar data baru langsung muncul
  await clearCachePattern("cache:events*");

  return findEventById(event.id);
};

export const updateEventService = async (
  id: string,
  organizerId: string,
  input: UpdateEventInput
) => {
  const event = await findEventById(id);
  if (!event) throw new Error("Event tidak ditemukan");
  if (event.organizer.id !== organizerId)
    throw new Error("Tidak memiliki akses untuk mengubah event ini");

  const { startDate, endDate, ...rest } = input;
  const updated = await updateEvent(id, {
    ...rest,
    ...(startDate && { startDate: new Date(startDate) }),
    ...(endDate && { endDate: new Date(endDate) }),
  });

  // Invalidate cache event ini + semua cache list events
  await Promise.all([
    deleteCache(REDIS_KEYS.CACHE_EVENT_BY_SLUG(event.slug)),
    clearCachePattern("cache:events*"),
  ]);

  return updated;
};

export const deleteEventService = async (id: string, organizerId: string) => {
  const event = await findEventById(id);
  if (!event) throw new Error("Event tidak ditemukan");
  if (event.organizer.id !== organizerId)
    throw new Error("Tidak memiliki akses untuk menghapus event ini");
  if (event.transactions.length > 0)
    throw new Error("Event yang sudah memiliki transaksi tidak dapat dihapus");

  const result = await deleteEvent(id);

  // Invalidate cache event ini + semua cache list events
  await Promise.all([
    deleteCache(REDIS_KEYS.CACHE_EVENT_BY_SLUG(event.slug)),
    clearCachePattern("cache:events*"),
  ]);

  return result;
};

export const getOrganizerEventsService = async (organizerId: string) => {
  return findEventsByOrganizer(organizerId);
};

export const getCitiesService = async () =>
  getOrSetCache(
    REDIS_KEYS.CACHE_CITIES,
    () => findAllCities(),
    REDIS_TTL.LONG // 1 jam — data kota jarang berubah
  );

export const getCategoriesService = async () =>
  getOrSetCache(
    REDIS_KEYS.CACHE_CATEGORIES,
    () => findAllCategories(),
    REDIS_TTL.LONG // 1 jam — data kategori jarang berubah
  );
