import type { Request, Response } from "express";
import { successResponse, errorResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
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