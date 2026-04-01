import type { Request, Response } from "express";
import {
  registerService,
  loginService,
  registerSchema,
  loginSchema,
} from "../services/auth.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { findUserById } from "../repositories/user.repository.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
    return;
  }
  try {
    const result = await registerService(parsed.data);
    successResponse(res, result, "Registrasi berhasil", 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Registrasi gagal";
    errorResponse(res, msg, 400);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    errorResponse(res, "Validasi gagal", 422, parsed.error.flatten().fieldErrors);
    return;
  }
  try {
    const result = await loginService(parsed.data);
    successResponse(res, result, "Login berhasil");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Login gagal";
    errorResponse(res, msg, 401);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) {
      errorResponse(res, "User tidak ditemukan", 404);
      return;
    }
    successResponse(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      referralCode: user.referralCode?.code,
    });
  } catch {
    errorResponse(res, "Gagal mendapatkan data user");
  }
};
