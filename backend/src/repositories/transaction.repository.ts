import prisma from "../lib/prisma.js";

export const findTransactionsByUser = async (userId: string) => {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: {
        include: {
          category: true,
          organizer: { select: { id: true, name: true, bankName: true, bankAccountName: true, bankAccountNumber: true } },
        },
      },
      promotion: true,
      tickets: { include: { ticketType: true } },
      redemptions: { include: { point: true } },
    },
  });
};

export const findTransactionById = async (id: string) => {
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

export const findTransactionsByEvent = async (eventId: string) => {
  return prisma.transaction.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      tickets: { include: { ticketType: true } },
    },
  });
};

export const findTicketTypeById = async (id: string) => {
  return prisma.ticketType.findUnique({ where: { id } });
};

export const findPromotionByCode = async (code: string, eventId: string) => {
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

export const findActivePointsByUser = async (userId: string) => {
  return prisma.point.findMany({
    where: {
      userId,
      status: "ACTIVE",
      expiredAt: { gt: new Date() },
    },
    orderBy: { createdAt: "asc" }, // FIFO - oldest first
  });
};
