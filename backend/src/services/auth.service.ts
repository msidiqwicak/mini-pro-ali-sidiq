import { z } from "zod";
import {
  findUserByEmail,
  createUser,
  findReferralCode,
  createReferralCode,
  incrementReferralUsage,
  createCoupon,
} from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { generateReferralCode } from "../utils/slug.js";
import { sendWelcomeEmail } from "../utils/mail.js";
import prisma from "../lib/prisma.js";
import { createHash } from "crypto";
import { setCache } from "../utils/cacheManager.js";
import { REDIS_KEYS } from "../utils/redisKeys.js";

export const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["CUSTOMER", "ORGANIZER"]).default("CUSTOMER"),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const registerService = async (input: RegisterInput) => {
  // Check email already exists
  const existing = await findUserByEmail(input.email);
  if (existing) throw new Error("Email sudah terdaftar");

  // Validate referral code if provided
  let referredById: string | undefined;
  let referralCodeRecord: Awaited<ReturnType<typeof findReferralCode>> = null;

  if (input.referralCode) {
    referralCodeRecord = await findReferralCode(input.referralCode);
    if (!referralCodeRecord) throw new Error("Referral code tidak valid");
    referredById = referralCodeRecord.ownerId;
  }

  const passwordHash = await hashPassword(input.password);

  // Create user
  const user = await createUser({
    email: input.email,
    name: input.name,
    passwordHash,
    role: input.role,
    ...(referredById && { referredById }),
  });

  // Auto-create referral code for new user
  let newRefCode = generateReferralCode();
  // Ensure unique
  let attempts = 0;
  while (attempts < 5) {
    try {
      await createReferralCode(user.id, newRefCode);
      break;
    } catch {
      newRefCode = generateReferralCode();
      attempts++;
    }
  }

  // If referral used: grant 10,000 points to referral owner (FIFO)
  if (referralCodeRecord && referredById) {
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    await prisma.point.create({
      data: {
        userId: referredById,
        amount: 10000,
        status: "ACTIVE",
        source: `Referral dari ${input.email}`,
        expiredAt: threeMonthsLater,
      },
    });

    // Create discount coupon for the NEW registrant (10% off, valid 3 months)
    const couponExpiry = new Date();
    couponExpiry.setMonth(couponExpiry.getMonth() + 3);
    const couponCode = `REF-${generateReferralCode()}`;
    await createCoupon(user.id, couponCode, 10, couponExpiry);

    // Increment referral usage count
    await incrementReferralUsage(referralCodeRecord.id);
  }

  // 🆕 Send welcome email
  try {
    await sendWelcomeEmail(user.email, user.name, newRefCode);
  } catch (error) {
    console.warn("Email gagal dikirim, user tetap terdaftar:", error);
    // Jangan throw error, email bukan critical path
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Fetch the referral code we just created for this user
  let myReferralCode: string | undefined;
  try {
    const rc = await prisma.referralCode.findUnique({ where: { ownerId: user.id } });
    myReferralCode = rc?.code;
  } catch {
    // non-critical
  }

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      referralCode: myReferralCode,
    },
  };
};

export const loginService = async (input: LoginInput) => {
  const user = await findUserByEmail(input.email);
  if (!user) throw new Error("Email atau password salah");

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw new Error("Email atau password salah");

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      referralCode: user.referralCode?.code,
    },
  };
};

/**
 * Logout — masukkan token ke Redis blacklist
 * Token akan otomatis kadaluarsa di Redis sesuai waktu expired JWT-nya
 */
export const logoutService = async (token: string): Promise<void> => {
  // Buat hash SHA-256 dari token agar tidak menyimpan token mentah di Redis
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const cacheKey = REDIS_KEYS.TOKEN_BLACKLIST(tokenHash);

  // Hitung sisa TTL dari JWT
  let ttlSeconds = 3600; // default 1 jam jika gagal decode
  try {
    const decoded = verifyToken(token) as { exp?: number };
    if (decoded.exp) {
      const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
      if (remainingSeconds > 0) ttlSeconds = remainingSeconds;
    }
  } catch {
    // Token sudah expired, tidak perlu di-blacklist lagi
    return;
  }

  await setCache(cacheKey, true, { ttl: ttlSeconds });
};
