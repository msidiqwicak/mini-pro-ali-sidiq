import type { Request, Response } from "express";
import {
  getReviewsService,
  createReviewService,
  createReviewSchema,
  canReviewService,
} from "../services/review.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

export const getEventReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getReviewsService(req.params.id as string);
    successResponse(res, result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil review";
    errorResponse(res, msg);
  }
};

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
    return;
  }
  try {
    const review = await createReviewService(req.user!.userId, parsed.data);
    successResponse(res, review, "Review berhasil dikirim", 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat review";
    errorResponse(res, msg, 400);
  }
};

export const canReviewController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await canReviewService(req.user!.userId, req.params.eventId as string);
    successResponse(res, result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memeriksa status review";
    errorResponse(res, msg);
  }
};

