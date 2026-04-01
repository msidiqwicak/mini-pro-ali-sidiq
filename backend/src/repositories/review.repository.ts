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
