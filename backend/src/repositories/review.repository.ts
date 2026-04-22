import prisma from "../lib/prisma.js";

export const findReviewsByEvent = async (eventId: string) => {
  return prisma.review.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
};

export const findReviewByUserAndEvent = async (
  userId: string,
  eventId: string
) => {
  return prisma.review.findUnique({ where: { userId_eventId: { userId, eventId } } });
};

export const hasUserPurchasedEvent = async (
  userId: string,
  eventId: string
): Promise<boolean> => {
  const tx = await prisma.transaction.findFirst({
    where: { userId, eventId, status: "PAID" },
  });
  return !!tx;
};

export const canReviewEvent = async (
  userId: string,
  eventId: string
): Promise<{ canReview: boolean; reason: string }> => {
  const [event, hasPurchased, hasReviewed] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { endDate: true } }),
    prisma.transaction.findFirst({ where: { userId, eventId, status: "PAID" } }),
    prisma.review.findUnique({ where: { userId_eventId: { userId, eventId } } }),
  ]);

  if (!event) return { canReview: false, reason: "Event tidak ditemukan" };
  if (!hasPurchased) return { canReview: false, reason: "Anda belum membeli tiket event ini" };
  if (new Date(event.endDate) > new Date()) return { canReview: false, reason: "Event belum selesai" };
  if (hasReviewed) return { canReview: false, reason: "Anda sudah memberikan ulasan" };

  return { canReview: true, reason: "" };
};

export const createReview = async (data: {
  userId: string;
  eventId: string;
  rating: number;
  comment: string;
}) => {
  return prisma.review.create({
    data,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
};
