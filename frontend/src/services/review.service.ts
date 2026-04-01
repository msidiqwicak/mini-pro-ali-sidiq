import api from "./api";
import type { ApiResponse, Review } from "../types";

interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  total: number;
}

export const reviewService = {
  getEventReviews: async (eventId: string) => {
    const res = await api.get<ApiResponse<ReviewsResponse>>(
      `/events/${eventId}/reviews`
    );
    return res.data;
  },

  createReview: async (data: {
    eventId: string;
    rating: number;
    comment: string;
  }) => {
    const res = await api.post<ApiResponse<Review>>("/reviews", data);
    return res.data;
  },
};
