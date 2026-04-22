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

export const hasUserAttendedEvent = async (
  userId: string,
  eventId: string
): Promise<boolean> => {
  // User must have a PAID transaction AND at least one ticket with isUsed=true
  const ticket = await prisma.ticket.findFirst({
    where: {
      userId,
      isUsed: true,
      transaction: { eventId, status: "PAID" },
    },
  });
  return !!ticket;
};

export const canReviewEvent = async (
  userId: string,
  eventId: string
): Promise<{ canReview: boolean; reason: string }> => {
  const [event, hasAttended, hasReviewed] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { endDate: true } }),
    prisma.ticket.findFirst({
      where: {
        userId,
        isUsed: true,
        transaction: { eventId, status: "PAID" },
      },
    }),
    prisma.review.findUnique({ where: { userId_eventId: { userId, eventId } } }),
  ]);

  if (!event) return { canReview: false, reason: "Event tidak ditemukan" };
  if (!hasAttended) return { canReview: false, reason: "Anda hanya bisa mereview setelah menghadiri event" };
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
