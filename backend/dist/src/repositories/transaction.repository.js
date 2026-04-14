import prisma from "../lib/prisma.js";
export const findTransactionsByUser = async (userId) => {
    return prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            event: {
                include: {
                    category: true,
                    organizer: { select: { id: true, name: true } },
                },
            },
            promotion: true,
            tickets: { include: { ticketType: true } },
            redemptions: { include: { point: true } },
        },
    });
};
export const findTransactionById = async (id) => {
    return prisma.transaction.findUnique({
        where: { id },
        include: {
            event: true,
            tickets: { include: { ticketType: true } },
            redemptions: true,
            promotion: true,
        },
    });
};
export const findTransactionsByEvent = async (eventId) => {
    return prisma.transaction.findMany({
        where: { eventId, status: "PAID" },
        include: {
            user: { select: { id: true, name: true, email: true } },
            tickets: { include: { ticketType: true } },
        },
    });
};
export const findTicketTypeById = async (id) => {
    return prisma.ticketType.findUnique({ where: { id } });
};
export const findPromotionByCode = async (code, eventId) => {
    // We fetch the promo and check maxUsage vs usedCount in service layer
    return prisma.promotion.findFirst({
        where: {
            code,
            eventId,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
        },
    });
};
export const findActivePointsByUser = async (userId) => {
    return prisma.point.findMany({
        where: {
            userId,
            status: "ACTIVE",
            expiredAt: { gt: new Date() },
        },
        orderBy: { createdAt: "asc" }, // FIFO - oldest first
    });
};
