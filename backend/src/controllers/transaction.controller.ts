import type { Response } from "express";
import {
  createTransactionService,
  getMyTransactionsService,
  payTransactionService,
  createTransactionSchema,
} from "../services/transaction.service.js";
import { getAvailablePoints } from "../services/point.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

export const createTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const parsed = createTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
    return;
  }
  try {
    const transaction = await createTransactionService(req.user!.userId, parsed.data);
    successResponse(res, transaction, "Transaksi berhasil dibuat", 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat transaksi";
    errorResponse(res, msg, 400);
  }
};

export const getMyTransactions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const transactions = await getMyTransactionsService(req.user!.userId);
    successResponse(res, transactions);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil transaksi";
    errorResponse(res, msg);
  }
};

export const payTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"])
      ? req.params["id"][0] ?? ""
      : req.params["id"] ?? "";

    const transaction = await payTransactionService(id, req.user!.userId);
    successResponse(res, transaction, "Pembayaran berhasil");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses pembayaran";
    errorResponse(res, msg, 400);
  }
};

export const getMyPoints = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const points = await getAvailablePoints(req.user!.userId);
    successResponse(res, points);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil poin";
    errorResponse(res, msg);
  }
};
