import type { Request, Response } from "express";
import {
  registerService,
  loginService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
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

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) {
      errorResponse(res, "Token tidak ditemukan", 400);
      return;
    }
    await logoutService(token);
    successResponse(res, null, "Logout berhasil");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Logout gagal";
    errorResponse(res, msg);
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorResponse(res, "Email tidak valid", 422);
    return;
  }
  try {
    await forgotPasswordService(email);
    // Always return 200 regardless of whether email existed (security)
    successResponse(res, null, "Jika email terdaftar, link reset akan dikirim");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses permintaan";
    errorResponse(res, msg);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword || newPassword.length < 8) {
    errorResponse(res, "Token dan password baru (min 8 karakter) wajib diisi", 422);
    return;
  }
  try {
    await resetPasswordService(token, newPassword);
    successResponse(res, null, "Password berhasil direset. Silakan login dengan password baru.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mereset password";
    errorResponse(res, msg, 400);
  }
};

