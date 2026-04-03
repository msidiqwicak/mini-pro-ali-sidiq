import { z } from "zod";
import {
  findUserById,
  updateUserById,
  updatePasswordById,
  findCouponsByUser,
} from "../repositories/user.repository.js";
import { findActivePointsByUser } from "../repositories/transaction.repository.js";
import { hashPassword, comparePassword } from "../utils/hash.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  avatarUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Services ─────────────────────────────────────────────────────────────────

export const updateProfileService = async (
  userId: string,
  input: UpdateProfileInput
) => {
  const data: { name?: string; avatarUrl?: string | null } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.avatarUrl !== undefined)
    data.avatarUrl = input.avatarUrl === "" ? null : input.avatarUrl;

  const user = await updateUserById(userId, data);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
};

export const changePasswordService = async (
  userId: string,
  input: ChangePasswordInput
) => {
  const user = await findUserById(userId);
  if (!user) throw new Error("User tidak ditemukan");

  const valid = await comparePassword(input.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Password lama tidak cocok");

  const newHash = await hashPassword(input.newPassword);
  await updatePasswordById(userId, newHash);
  return { message: "Password berhasil diubah" };
};

export const getPointsService = async (userId: string) => {
  const points = await findActivePointsByUser(userId);
  const total = points.reduce((sum, p) => sum + p.amount, 0);
  return { points, total };
};

export const getCouponsService = async (userId: string) => {
  const coupons = await findCouponsByUser(userId);
  return { coupons };
};
