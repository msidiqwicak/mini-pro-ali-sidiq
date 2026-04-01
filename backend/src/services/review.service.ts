import { z } from "zod";
import {
  findReviewsByEvent,
  findReviewByUserAndEvent,
  hasUserPurchasedEvent,
  createReview,
} from "../repositories/review.repository.js";

export const createReviewSchema = z.object({
  eventId: z.string().min(1, "Event ID wajib diisi"),
  rating: z.number().int().min(1).max(5, "Rating harus antara 1–5"),
  comment: z.string().min(10, "Komentar minimal 10 karakter"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const getReviewsService = async (eventId: string) => {
  const reviews = await findReviewsByEvent(eventId);
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
  return { reviews, averageRating: Math.round(avg * 10) / 10, total: reviews.length };
};

export const createReviewService = async (
  userId: string,
  input: CreateReviewInput
) => {
  // Check if user purchased this event
  const purchased = await hasUserPurchasedEvent(userId, input.eventId);
  if (!purchased)
    throw new Error("Anda hanya bisa mereview event yang sudah dibeli");

  // Check duplicate review
  const existing = await findReviewByUserAndEvent(userId, input.eventId);
  if (existing) throw new Error("Anda sudah memberikan review untuk event ini");

  return createReview({ ...input, userId });
};
