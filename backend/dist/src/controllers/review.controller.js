import { getReviewsService, createReviewService, createReviewSchema, } from "../services/review.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
export const getEventReviews = async (req, res) => {
    try {
        const result = await getReviewsService(req.params.id);
        successResponse(res, result);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal mengambil review";
        errorResponse(res, msg);
    }
};
export const createReview = async (req, res) => {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
        errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
        return;
    }
    try {
        const review = await createReviewService(req.user.userId, parsed.data);
        successResponse(res, review, "Review berhasil dikirim", 201);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal membuat review";
        errorResponse(res, msg, 400);
    }
};
