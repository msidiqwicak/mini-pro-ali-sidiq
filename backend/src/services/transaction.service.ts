import { z } from "zod";
import prisma from "../lib/prisma.js";
import {
  findTransactionsByUser,
  findTicketTypeById,
  findActivePointsByUser,
} from "../repositories/transaction.repository.js";
import { calculatePointsRedemption } from "./point.service.js";
import { generateQRCode } from "../utils/slug.js";
import { sendTicketEmail, sendPaymentConfirmation } from "../utils/mail.js";

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
  return prisma.$transaction(async (tx) => {
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

    // ─── STEP 3: Apply promotion (if any) ────────────────────────
    if (input.promotionCode) {
      const promo = await tx.promotion.findFirst({
        where: {
          code: input.promotionCode,
          eventId: input.eventId,
        },
      });

      if (!promo) {
        throw new Error("Kode promo tidak valid");
      }

      const now = new Date();
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
    }

    // ─── STEP 4: Apply referral discount (10%) ───────────────────
    // Referral discount applied via REFERRAL_VOUCHER promo code
    // (already handled in Step 3 if code is referral type)

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
};

export const getMyTransactionsService = async (userId: string) => {
  return findTransactionsByUser(userId);
};

/**
 * Simulate payment (mark PENDING → PAID)
 */
export const payTransactionService = async (
  transactionId: string,
  userId: string
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: true,
      event: true,
      tickets: { include: { ticketType: true } },
    },
  });

  if (!transaction) throw new Error("Transaksi tidak ditemukan");
  if (transaction.userId !== userId) throw new Error("Tidak memiliki akses");
  if (transaction.status !== "PENDING")
    throw new Error("Status transaksi tidak valid");

  // Mark as paid
  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentMethod: "BANK_TRANSFER",
    },
  });

  // 🆕 Send confirmation emails asynchronously (don't block response)
  try {
    // Generate QR code untuk ticket
    const firstTicket = transaction.tickets[0];

    if (!firstTicket) {
      console.warn(`⚠️ No tickets found for transaction ${transactionId}`);
    } else {
      const qrCodeDataUrl = `data:image/png;base64,${firstTicket.qrCode}`;

      // Send ticket email
      await sendTicketEmail(
        transaction.user.email,
        transaction.user.name,
        transaction.event.name,
        firstTicket.qrCode,
        qrCodeDataUrl,
        transaction.tickets.length,
        updatedTransaction.finalAmount
      );

      // Send payment confirmation
      await sendPaymentConfirmation(
        transaction.user.email,
        transaction.user.name,
        updatedTransaction.finalAmount,
        transactionId,
        transaction.event.name
      );

      console.log(`✅ Confirmation emails sent for transaction ${transactionId}`);
    }
  } catch (emailError) {
    // Log email error tapi jangan throw (pembayaran sudah sukses di database)
    console.warn(
      `⚠️ Email gagal dikirim untuk transaksi ${transactionId}:`,
      emailError
    );
  }

  return updatedTransaction;
};
