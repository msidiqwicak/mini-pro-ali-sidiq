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
      event: { select: { name: true } },
    },
  });
};

export const findAllTransactionsByOrganizer = async (organizerId: string) => {
  return prisma.transaction.findMany({
    where: { event: { organizerId } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      tickets: { include: { ticketType: true } },
      event: { select: { name: true } },
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

// ─── Lazy Expiry Helpers ────────────────────────────────────────────

/**
 * Find PENDING transactions older than 2 hours (no payment proof uploaded).
 */
export const findExpiredPendingTransactions = async (userId: string) => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  return prisma.transaction.findMany({
    where: {
      userId,
      status: "PENDING",
      createdAt: { lte: twoHoursAgo },
    },
    include: {
      tickets: { select: { ticketTypeId: true } },
      redemptions: { select: { pointId: true, amountUsed: true } },
      promotion: { select: { id: true } },
      coupon: { select: { id: true } },
    },
  });
};

/**
 * Find WAITING_PAYMENT transactions older than 3 days (organizer hasn't responded).
 */
export const findExpiredWaitingTransactions = async (userId: string) => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return prisma.transaction.findMany({
    where: {
      userId,
      status: "WAITING_PAYMENT",
      updatedAt: { lte: threeDaysAgo },
    },
    include: {
      tickets: { select: { ticketTypeId: true } },
      redemptions: { select: { pointId: true, amountUsed: true } },
      promotion: { select: { id: true } },
      coupon: { select: { id: true } },
    },
  });
};
