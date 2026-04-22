import type { Request, Response } from "express";
import { successResponse, errorResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import prisma from "../lib/prisma.js";
import {
  getEventsService,
  getEventBySlugService,
  createEventService,
  updateEventService,
  deleteEventService,
  getOrganizerEventsService,
  getCitiesService,
  getCategoriesService,
  createEventSchema,
  updateEventSchema,
  getEventPromotionsService,
  createPromotionService,
  createPromotionSchema,
  deletePromotionService,
} from "../services/event.service.js";

// Helper — pastikan param selalu string

const param = (val: string | string[] | undefined): string => {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
};

// Helper — pastikan query selalu string | undefined
const query = (val: string | string[] | undefined): string | undefined => {
  if (Array.isArray(val)) return val[0];
  return val || undefined;
};

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, city, categoryId, page, limit } = req.query;
    const result = await getEventsService({
      search: query(search as string | undefined),
      city: query(city as string | undefined),
      categoryId: query(categoryId as string | undefined),
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 9,
    });
    successResponse(res, result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil data events";
    errorResponse(res, msg);
  }
};

export const getEventBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await getEventBySlugService(param(req.params["slug"]));
    successResponse(res, event);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Event tidak ditemukan";
    errorResponse(res, msg, 404);
  }
};

export const createEventController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
    return;
  }
  try {
    const event = await createEventService(req.user!.userId, parsed.data);
    successResponse(res, event, "Event berhasil dibuat", 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat event";
    errorResponse(res, msg, 400);
  }
};

export const updateEventController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
    return;
  }
  try {
    const event = await updateEventService(
      param(req.params["id"]),
      req.user!.userId,
      parsed.data
    );
    successResponse(res, event, "Event berhasil diperbarui");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui event";
    const status = msg.includes("tidak ditemukan") ? 404
      : msg.includes("akses") ? 403 : 400;
    errorResponse(res, msg, status);
  }
};

export const deleteEventController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await deleteEventService(param(req.params["id"]), req.user!.userId);
    successResponse(res, null, "Event berhasil dihapus");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus event";
    const status = msg.includes("tidak ditemukan") ? 404
      : msg.includes("akses") ? 403 : 400;
    errorResponse(res, msg, status);
  }
};

export const getOrganizerEvents = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const events = await getOrganizerEventsService(req.user!.userId);
    successResponse(res, events);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil data events";
    errorResponse(res, msg);
  }
};

export const getCities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cities = await getCitiesService();
    successResponse(res, cities);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil kota";
    errorResponse(res, msg);
  }
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getCategoriesService();
    successResponse(res, categories);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil kategori";
    errorResponse(res, msg);
  }
};

export const getOrganizerPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizerId = param(req.params["id"] as string);

    const [organizer, recentReviews] = await Promise.all([
      prisma.user.findUnique({
        where: { id: organizerId, role: "ORGANIZER" },
        select: {
          id: true, name: true, avatarUrl: true,
          organizedEvents: {
            where: { status: "PUBLISHED" },
            orderBy: { startDate: "desc" },
            take: 20,
            select: {
              id: true, name: true, slug: true, imageUrl: true,
              location: true, city: true, startDate: true, endDate: true,
              isFree: true, totalSeats: true, soldSeats: true,
              category: { select: { name: true } },
              ticketTypes: { select: { price: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
      }),
      // Fetch 10 latest reviews across all organizer events
      prisma.review.findMany({
        where: { event: { organizerId } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, rating: true, comment: true, createdAt: true,
          user: { select: { name: true, avatarUrl: true } },
          event: { select: { name: true, slug: true } },
        },
      }),
    ]);

    if (!organizer) {
      errorResponse(res, "Organizer tidak ditemukan", 404);
      return;
    }

    const allRatings = organizer.organizedEvents.flatMap((e) => e.reviews.map((r) => r.rating));
    const avgRating = allRatings.length > 0
      ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
      : 0;

    successResponse(res, {
      organizer: {
        id: organizer.id,
        name: organizer.name,
        avatarUrl: organizer.avatarUrl,
        organizedEvents: organizer.organizedEvents,
      },
      avgRating,
      totalReviews: allRatings.length,
      recentReviews,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil profil organizer";
    errorResponse(res, msg);
  }
};

// ─── Promotion Controllers ────────────────────────────────────────────

export const getEventPromotions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const promos = await getEventPromotionsService(param(req.params.eventId), req.user!.userId);
    successResponse(res, promos);
  } catch (err) {
    errorResponse(res, err instanceof Error ? err.message : "Gagal mengambil promosi");
  }
};

export const createPromotion = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createPromotionSchema.safeParse(req.body);
  if (!parsed.success) {
    errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
    return;
  }
  try {
    const promo = await createPromotionService(param(req.params.eventId), req.user!.userId, parsed.data);
    successResponse(res, promo, "Promosi berhasil dibuat", 201);
  } catch (err) {
    errorResponse(res, err instanceof Error ? err.message : "Gagal membuat promosi", 400);
  }
};

export const deletePromotion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await deletePromotionService(param(req.params.promoId), param(req.params.eventId), req.user!.userId);
    successResponse(res, null, "Promosi berhasil dihapus");
  } catch (err) {
    errorResponse(res, err instanceof Error ? err.message : "Gagal menghapus promosi", 400);
  }
};

