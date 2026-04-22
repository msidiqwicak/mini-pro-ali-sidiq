import type { Response } from "express";
import prisma from "../lib/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const param = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/**
 * GET /tickets/event/:eventId
 * Organizer: get all tickets for an event they own (for attendance management)
 */
export const getEventTickets = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const eventId = param(req.params["eventId"]);

    // Verify organizer owns this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, name: true },
    });
    if (!event) { errorResponse(res, "Event tidak ditemukan", 404); return; }
    if (event.organizerId !== req.user!.userId) {
      errorResponse(res, "Akses ditolak", 403); return;
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        transaction: { eventId, status: "PAID" },
      },
      include: {
        ticketType: { select: { name: true } },
        transaction: {
          select: {
            id: true,
            finalAmount: true,
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    successResponse(res, tickets);
  } catch {
    errorResponse(res, "Gagal mengambil data tiket", 500);
  }
};

/**
 * PATCH /tickets/:ticketId/scan
 * Organizer: mark a ticket as used (attendee checked in)
 */
export const scanTicket = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ticketId = param(req.params["ticketId"]);

    // Find ticket and verify ownership chain
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        transaction: {
          include: {
            event: { select: { organizerId: true, name: true } },
          },
        },
      },
    });

    if (!ticket) { errorResponse(res, "Tiket tidak ditemukan", 404); return; }
    if (ticket.transaction.event.organizerId !== req.user!.userId) {
      errorResponse(res, "Akses ditolak — bukan event Anda", 403); return;
    }
    if (ticket.isUsed) {
      errorResponse(res, "Tiket ini sudah discan sebelumnya", 409); return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { isUsed: true },
      include: {
        ticketType: { select: { name: true } },
        transaction: {
          select: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    successResponse(res, updated, "Kehadiran berhasil dicatat");
  } catch {
    errorResponse(res, "Gagal scan tiket", 500);
  }
};
