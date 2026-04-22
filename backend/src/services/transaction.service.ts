import { z } from "zod";
import prisma from "../lib/prisma.js";
import {
  findTransactionsByUser,
  findTicketTypeById,
  findActivePointsByUser,
  findExpiredPendingTransactions,
  findExpiredWaitingTransactions,
} from "../repositories/transaction.repository.js";
import { calculatePointsRedemption } from "./point.service.js";
import { generateQRCode } from "../utils/slug.js";
import { sendTicketEmail, sendPaymentConfirmation } from "../utils/mail.js";
import { deleteCache } from "../utils/cacheManager.js";
import { REDIS_KEYS } from "../utils/redisKeys.js";

export const createTransactionSchema = z.object({
  eventId: z.string().min(1, "Event ID wajib diisi"),
  ticketTypeId: z.string().min(1, "Tipe tiket wajib dipilih"),
  quantity: z.number().int().min(1).max(10),
  promotionCode: z.string().optional(),
  pointsToUse: z.number().int().min(0).default(0),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

/**
 * ATOMIC TRANSACTION — All 11 steps in one Prisma.$transaction
 */
export const createTransactionService = async (
  userId: string,
  input: CreateTransactionInput
) => {
  const result = await prisma.$transaction(async (tx) => {
    // ─── STEP 1: Validate ticket type & seat availability ────────
    const ticketType = await tx.ticketType.findUnique({
      where: { id: input.ticketTypeId },
      include: { event: true },
    });

    if (!ticketType) throw new Error("Tipe tiket tidak ditemukan");
    if (ticketType.eventId !== input.eventId)
      throw new Error("Tiket tidak sesuai dengan event");
    if (ticketType.event.status !== "PUBLISHED")
      throw new Error("Event tidak tersedia untuk pembelian");

    const remaining = ticketType.quota - ticketType.sold;
    if (remaining < input.quantity)
      throw new Error(
        `Sisa kursi tidak mencukupi. Tersedia: ${remaining} tiket`
      );

    // ─── STEP 2: Calculate base price ────────────────────────────
    const baseAmount = ticketType.price * input.quantity;
    let discountAmount = 0;
    let promotionId: string | undefined;
    let couponId: string | undefined;

    // ─── STEP 3: Apply promotion (if any) ────────────────────────
    if (input.promotionCode) {
      const now = new Date();

      const promo = await tx.promotion.findFirst({
        where: {
          code: input.promotionCode,
          eventId: input.eventId,
        },
      });

      if (promo) {
        if (now < promo.startDate) {
          throw new Error("Kode promo ini belum aktif");
        }
        if (now > promo.endDate) {
          throw new Error("Kode promo sudah kadaluarsa");
        }
        if (promo.usedCount >= promo.maxUsage) {
          throw new Error("Kode promo sudah habis digunakan");
        }

        // Calculate discount
        if (promo.discountPercent) {
          discountAmount = Math.floor((baseAmount * promo.discountPercent) / 100);
        } else if (promo.discountAmount) {
          discountAmount = Math.min(promo.discountAmount, baseAmount);
        }

        promotionId = promo.id;

        // Update promo usage
        await tx.promotion.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      } else {
        const coupon = await tx.coupon.findFirst({
          where: {
            code: input.promotionCode,
            userId: userId,
          },
        });

        if (!coupon) {
          throw new Error("Kode promo tidak valid");
        }
        if (coupon.isUsed) {
          throw new Error("Kupon diskon sudah digunakan");
        }
        if (now > coupon.expiredAt) {
          throw new Error("Kupon diskon sudah kadaluarsa");
        }

        discountAmount = Math.floor((baseAmount * coupon.discountPercent) / 100);
        couponId = coupon.id;

        // Mark coupon as used
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { isUsed: true },
        });
      }
    }

    // ─── STEP 4: Apply referral discount (10%) ───────────────────
    // Referral discount applied via Coupon
    // (already handled in Step 3 if code is referral coupon type)

    // ─── STEP 5: Apply points redemption ─────────────────────────
    let pointsUsed = 0;
    const priceAfterDiscount = baseAmount - discountAmount;

    if (input.pointsToUse > 0) {
      const activePoints = await findActivePointsByUser(userId);
      const totalAvailable = activePoints.reduce((sum, p) => sum + p.amount, 0);

      const maxUsable = Math.min(
        input.pointsToUse,
        totalAvailable,
        priceAfterDiscount // Can't use more points than remaining price
      );

      if (maxUsable > 0) {
        pointsUsed = maxUsable;
      }
    }

    // ─── STEP 6: Calculate final amount ──────────────────────────
    const finalAmount = Math.max(0, priceAfterDiscount - pointsUsed);

    // ─── STEP 7: Create Transaction ──────────────────────────────
    const transaction = await tx.transaction.create({
      data: {
        userId,
        eventId: input.eventId,
        promotionId: promotionId ?? null,
        couponId: couponId ?? null,
        baseAmount,
        discountAmount,
        pointsUsed,
        finalAmount,
        status: finalAmount === 0 ? "PAID" : "PENDING",
        paidAt: finalAmount === 0 ? new Date() : null,
        paymentMethod: finalAmount === 0 ? "FREE/POINTS" : null,
      },
    });

    // ─── STEP 8: Create Tickets ──────────────────────────────────
    const tickets = [];
    for (let i = 0; i < input.quantity; i++) {
      tickets.push({
        transactionId: transaction.id,
        ticketTypeId: input.ticketTypeId,
        userId,
        qrCode: generateQRCode(),
      });
    }

    await tx.ticket.createMany({ data: tickets });

    // ─── STEP 9: Update TicketType.sold & Event.soldSeats ────────
    await tx.ticketType.update({
      where: { id: input.ticketTypeId },
      data: { sold: { increment: input.quantity } },
    });

    await tx.event.update({
      where: { id: input.eventId },
      data: { soldSeats: { increment: input.quantity } },
    });

    // ─── STEP 10 & 11: Deduct points + Create Redemption records ─
    if (pointsUsed > 0) {
      const activePoints = await findActivePointsByUser(userId);
      const redemptionPlan = calculatePointsRedemption(activePoints, pointsUsed);

      for (const plan of redemptionPlan) {
        // Fetch current point amount
        const point = await tx.point.findUnique({ where: { id: plan.pointId } });
        if (!point) continue;

        const newAmount = point.amount - plan.amountUsed;

        // Update point amount/status
        await tx.point.update({
          where: { id: plan.pointId },
          data: {
            amount: newAmount,
            status: newAmount <= 0 ? "USED" : "ACTIVE",
          },
        });

        // Create Redemption record
        await tx.redemption.create({
          data: {
            userId,
            pointId: plan.pointId,
            transactionId: transaction.id,
            amountUsed: plan.amountUsed,
          },
        });
      }
    }

    return transaction;
  });

  // Invalidate cache event setelah tiket terjual (soldSeats berubah)
  // Dijalankan di luar prisma.$transaction agar tidak block commit
  const eventSlug = await prisma.event
    .findUnique({ where: { id: input.eventId }, select: { slug: true } })
    .then((e) => e?.slug);

  if (eventSlug) {
    await Promise.all([
      deleteCache(REDIS_KEYS.CACHE_EVENT_BY_SLUG(eventSlug)),
      // clearCachePattern tidak dipakai di sini karena list events
      // di-refresh oleh event.service saat ada mutasi struktural
    ]);
  }

  return result;
};

/**
 * Lazy evaluation: auto-expire stale transactions before returning data.
 * - PENDING > 2 hours → EXPIRED (rollback seats + points + voucher)
 * - WAITING_PAYMENT > 3 days → CANCELLED (rollback seats + points + voucher)
 */
export const syncStaleTransactions = async (userId: string) => {
  // ── 1. PENDING → EXPIRED (2 hours) ─────────────────────────────────
  const pendingExpired = await findExpiredPendingTransactions(userId);
  for (const tx of pendingExpired) {
    const ticketCounts: Record<string, number> = {};
    for (const t of tx.tickets) {
      ticketCounts[t.ticketTypeId] = (ticketCounts[t.ticketTypeId] ?? 0) + 1;
    }
    const totalTickets = tx.tickets.length;

    await prisma.$transaction(async (db) => {
      await db.transaction.update({ where: { id: tx.id }, data: { status: "EXPIRED" } });

      if (totalTickets > 0) {
        await db.event.update({ where: { id: tx.eventId }, data: { soldSeats: { decrement: totalTickets } } });
        for (const [ticketTypeId, count] of Object.entries(ticketCounts)) {
          await db.ticketType.update({ where: { id: ticketTypeId }, data: { sold: { decrement: count } } });
        }
      }

      for (const redemption of tx.redemptions) {
        await db.point.update({
          where: { id: redemption.pointId },
          data: { amount: { increment: redemption.amountUsed }, status: "ACTIVE" },
        });
      }

      // Rollback voucher quota
      if (tx.promotion?.id) {
        await db.promotion.update({
          where: { id: tx.promotion.id },
          data: { usedCount: { decrement: 1 } },
        });
      }

      // Rollback Coupon
      if (tx.coupon?.id) {
        await db.coupon.update({
          where: { id: tx.coupon.id },
          data: { isUsed: false },
        });
      }
    });
  }

  // ── 2. WAITING_PAYMENT → CANCELLED (3 days) ────────────────────────
  const waitingExpired = await findExpiredWaitingTransactions(userId);
  for (const tx of waitingExpired) {
    const ticketCounts: Record<string, number> = {};
    for (const t of tx.tickets) {
      ticketCounts[t.ticketTypeId] = (ticketCounts[t.ticketTypeId] ?? 0) + 1;
    }
    const totalTickets = tx.tickets.length;

    await prisma.$transaction(async (db) => {
      await db.transaction.update({ where: { id: tx.id }, data: { status: "CANCELLED" } });

      if (totalTickets > 0) {
        await db.event.update({ where: { id: tx.eventId }, data: { soldSeats: { decrement: totalTickets } } });
        for (const [ticketTypeId, count] of Object.entries(ticketCounts)) {
          await db.ticketType.update({ where: { id: ticketTypeId }, data: { sold: { decrement: count } } });
        }
      }

      for (const redemption of tx.redemptions) {
        await db.point.update({
          where: { id: redemption.pointId },
          data: { amount: { increment: redemption.amountUsed }, status: "ACTIVE" },
        });
      }

      // Rollback voucher quota
      if (tx.promotion?.id) {
        await db.promotion.update({
          where: { id: tx.promotion.id },
          data: { usedCount: { decrement: 1 } },
        });
      }

      // Rollback Coupon
      if (tx.coupon?.id) {
        await db.coupon.update({
          where: { id: tx.coupon.id },
          data: { isUsed: false },
        });
      }
    });
  }
};

export const getMyTransactionsService = async (userId: string) => {
  // Sync expired transactions lazily before fetching
  await syncStaleTransactions(userId);
  return findTransactionsByUser(userId);
};

/**
 * Customer upload bukti transfer → status PENDING → WAITING_PAYMENT
 */
export const payTransactionService = async (
  transactionId: string,
  userId: string,
  paymentProofUrl: string
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      event: {
        include: {
          organizer: {
            select: {
              bankName: true,
              bankAccountName: true,
              bankAccountNumber: true,
            },
          },
        },
      },
    },
  });

  if (!transaction) throw new Error("Transaksi tidak ditemukan");
  if (transaction.userId !== userId) throw new Error("Tidak memiliki akses");
  if (transaction.status !== "PENDING")
    throw new Error("Status transaksi tidak valid untuk upload bukti");

  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: "WAITING_PAYMENT",
      paymentProofUrl,
      paymentMethod: "BANK_TRANSFER",
      // Salin info rekening dari organizer agar tersimpan di transaksi
      bankName: transaction.event.organizer.bankName,
      bankAccountName: transaction.event.organizer.bankAccountName,
      bankAccountNumber: transaction.event.organizer.bankAccountNumber,
    },
  });

  return updatedTransaction;
};

/**
 * Organizer menyetujui bukti transfer → WAITING_PAYMENT → PAID
 */
export const approveTransactionService = async (
  transactionId: string,
  organizerId: string
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: true,
      event: { select: { organizerId: true, name: true } },
      tickets: { include: { ticketType: true } },
    },
  });

  if (!transaction) throw new Error("Transaksi tidak ditemukan");
  if (transaction.event.organizerId !== organizerId)
    throw new Error("Tidak memiliki akses untuk menyetujui transaksi ini");
  if (transaction.status !== "WAITING_PAYMENT")
    throw new Error("Transaksi tidak dalam status menunggu konfirmasi");

  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "PAID", paidAt: new Date() },
  });

  // Kirim email konfirmasi ke buyer (async, jangan block response)
  Promise.all([
    sendTicketEmail(
      transaction.user.email,
      transaction.user.name,
      transaction.event.name,
      transaction.tickets[0]?.qrCode ?? "",
      "",
      transaction.tickets.length,
      updatedTransaction.finalAmount
    ),
    sendPaymentConfirmation(
      transaction.user.email,
      transaction.user.name,
      updatedTransaction.finalAmount,
      transactionId,
      transaction.event.name
    ),
  ]).catch((err) =>
    console.warn(`⚠️ Email gagal dikirim untuk transaksi ${transactionId}:`, err)
  );

  return updatedTransaction;
};

/**
 * Organizer menolak bukti transfer → WAITING_PAYMENT → REJECTED
 * Rollback: soldSeats & ticketType.sold & points & voucher dikembalikan
 */
export const rejectTransactionService = async (
  transactionId: string,
  organizerId: string
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      event: { select: { id: true, organizerId: true } },
      tickets: { select: { ticketTypeId: true } },
      redemptions: { select: { pointId: true, amountUsed: true } },
      promotion: { select: { id: true } },
      coupon: { select: { id: true } },
    },
  });

  if (!transaction) throw new Error("Transaksi tidak ditemukan");
  if (transaction.event.organizerId !== organizerId)
    throw new Error("Tidak memiliki akses untuk menolak transaksi ini");
  if (transaction.status !== "WAITING_PAYMENT")
    throw new Error("Transaksi tidak dalam status menunggu konfirmasi");

  const ticketCounts: Record<string, number> = {};
  for (const ticket of transaction.tickets) {
    ticketCounts[ticket.ticketTypeId] = (ticketCounts[ticket.ticketTypeId] ?? 0) + 1;
  }
  const totalTickets = transaction.tickets.length;

  await prisma.$transaction(async (tx) => {
    // Mark as REJECTED (distinct from system CANCELLED)
    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: "REJECTED" },
    });

    // Rollback soldSeats
    await tx.event.update({
      where: { id: transaction.event.id },
      data: { soldSeats: { decrement: totalTickets } },
    });

    // Rollback each ticket type sold count
    for (const [ticketTypeId, count] of Object.entries(ticketCounts)) {
      await tx.ticketType.update({
        where: { id: ticketTypeId },
        data: { sold: { decrement: count } },
      });
    }

    // Rollback points used
    for (const redemption of transaction.redemptions) {
      await tx.point.update({
        where: { id: redemption.pointId },
        data: { amount: { increment: redemption.amountUsed }, status: "ACTIVE" },
      });
    }

    // Rollback voucher quota
    if (transaction.promotion?.id) {
      await tx.promotion.update({
        where: { id: transaction.promotion.id },
        data: { usedCount: { decrement: 1 } },
      });
    }

    // Rollback Coupon
    if (transaction.coupon?.id) {
      await tx.coupon.update({
        where: { id: transaction.coupon.id },
        data: { isUsed: false },
      });
    }
  });

  return { message: "Transaksi berhasil ditolak" };
};
