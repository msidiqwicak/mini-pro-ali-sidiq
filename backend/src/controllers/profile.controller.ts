import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { successResponse, errorResponse } from "../utils/response.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateProfileService,
  changePasswordService,
  getPointsService,
  getCouponsService,
} from "../services/profile.service.js";

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
    return;
  }
  try {
    const user = await updateProfileService(req.user!.userId, parsed.data);
    successResponse(res, user, "Profil berhasil diperbarui");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui profil";
    errorResponse(res, msg, 400);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
    return;
  }
  try {
    const result = await changePasswordService(req.user!.userId, parsed.data);
    successResponse(res, result, result.message);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengubah password";
    errorResponse(res, msg, 400);
  }
};

export const getPoints = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await getPointsService(req.user!.userId);
    successResponse(res, result, "Data poin berhasil diambil");
  } catch {
    errorResponse(res, "Gagal mengambil data poin");
  }
};

export const getCoupons = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await getCouponsService(req.user!.userId);
    successResponse(res, result, "Data kupon berhasil diambil");
  } catch {
    errorResponse(res, "Gagal mengambil data kupon");
  }
};
