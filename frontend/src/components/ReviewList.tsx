import { Star, MessageSquare } from "lucide-react";
import type { Review } from "../types";
import { formatDate } from "../utils/helpers";

const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={size}
        className={i < rating ? "text-[var(--accent-gold)] fill-[var(--accent-gold)]" : "text-[var(--border)]"}
      />
    ))}
  </div>
);

interface ReviewListProps {
  reviews: Review[];
  averageRating: number;
  total: number;
}

const ReviewList = ({ reviews, averageRating, total }: ReviewListProps) => {
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  if (total === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
        <p className="text-[var(--text-muted)] text-sm">Belum ada review untuk event ini</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex gap-8 mb-8 p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
        <div className="text-center">
          <p className="font-display text-5xl text-white">{averageRating.toFixed(1)}</p>
          <StarRating rating={Math.round(averageRating)} size={16} />
          <p className="text-xs text-[var(--text-muted)] mt-1">{total} review</p>
        </div>
        <div className="flex-1 space-y-2">
          {distribution.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] w-3">{star}</span>
              <Star size={10} className="text-[var(--accent-gold)] fill-[var(--accent-gold)]" />
              <div className="flex-1 h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-gold)] rounded-full"
                  style={{ width: total ? `${(count / total) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)] w-4">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center overflow-hidden flex-shrink-0">
                {review.user.avatarUrl ? (
                  <img src={review.user.avatarUrl} alt={review.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {review.user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <p className="font-medium text-sm text-white">{review.user.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(review.createdAt)}</p>
                </div>
                <StarRating rating={review.rating} size={12} />
                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{review.comment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { StarRating };
export default ReviewList;
