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
import { sendWelcomeEmail, sendResetPasswordEmail } from "../utils/mail.js";
import prisma from "../lib/prisma.js";
import { createHash, randomBytes } from "crypto";
import { setCache, getCache, deleteCache, incrementCache, getCacheTTL } from "../utils/cacheManager.js";
import { REDIS_KEYS, REDIS_TTL } from "../utils/redisKeys.js";
import { config } from "../config/env.js";


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
  const attemptKey = `login_attempts:${input.email.toLowerCase()}`;
  const lockKey = `login_locked:${input.email.toLowerCase()}`;

  // Check if locked out
  const isLocked = await getCache<string>(lockKey);
  if (isLocked) {
    const secondsLeft = await getCacheTTL(lockKey);
    const minsLeft = Math.ceil(Math.max(secondsLeft, 0) / 60);
    throw new Error(
      `Terlalu banyak percobaan gagal. Coba lagi dalam ${minsLeft} menit.`
    );
  }

  const user = await findUserByEmail(input.email);
  if (!user) throw new Error("Email atau password salah");

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    // Atomic increment, expire counter after 10 min idle
    const newAttempts = await incrementCache(attemptKey, 1);
    if (newAttempts === 1) {
      // Set TTL on first failure
      await setCache(attemptKey, String(newAttempts), { ttl: 10 * 60 });
    }

    if (newAttempts >= 3) {
      const lockSeconds = 5 * 60;
      await setCache(lockKey, "locked", { ttl: lockSeconds });
      await deleteCache(attemptKey);
      throw new Error(
        "Terlalu banyak percobaan gagal. Akun dikunci sementara selama 5 menit."
      );
    }

    const remaining = 3 - newAttempts;
    throw new Error(
      `Email atau password salah. Sisa percobaan: ${remaining}x sebelum akun dikunci.`
    );
  }

  // Login success — clear rate limit keys
  await deleteCache([attemptKey, lockKey]);

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

/**
 * Forgot Password — generate token, store in Redis, send email
 */
export const forgotPasswordService = async (email: string): Promise<void> => {
  const user = await findUserByEmail(email);
  // Do not reveal whether email exists for security; just silently succeed
  if (!user) return;

  // Generate a secure random token
  const rawToken = randomBytes(32).toString("hex");
  const redisKey = REDIS_KEYS.RESET_TOKEN(rawToken);

  // Store userId under the token key with 15-min TTL
  await setCache(redisKey, user.id, { ttl: REDIS_TTL.RESET_TOKEN });

  // Build reset link
  const resetLink = `${config.frontendUrl}/reset-password?token=${rawToken}`;

  await sendResetPasswordEmail(user.email, user.name, resetLink);
};

/**
 * Reset Password — verify token, update password, delete token
 */
export const resetPasswordService = async (
  token: string,
  newPassword: string
): Promise<void> => {
  const redisKey = REDIS_KEYS.RESET_TOKEN(token);
  const userId = await getCache<string>(redisKey);

  if (!userId) throw new Error("Token tidak valid atau sudah kadaluarsa");

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Invalidate token immediately (single-use)
  await deleteCache(redisKey);
};

