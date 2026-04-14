import prisma from "../lib/prisma.js";
export const findReviewsByEvent = async (eventId) => {
    return prisma.review.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
        },
    });
};
export const findReviewByUserAndEvent = async (userId, eventId) => {
    return prisma.review.findUnique({ where: { userId_eventId: { userId, eventId } } });
};
export const hasUserPurchasedEvent = async (userId, eventId) => {
    const tx = await prisma.transaction.findFirst({
        where: { userId, eventId, status: "PAID" },
    });
    return !!tx;
};
export const createReview = async (data) => {
    return prisma.review.create({
        data,
        include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
        },
    });
};
