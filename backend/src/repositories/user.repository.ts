import prisma from "../lib/prisma.js";

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    include: { referralCode: true },
  });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: { referralCode: true },
  });
};

export const createUser = async (data: {
  email: string;
  name: string;
  passwordHash: string;
  role?: "CUSTOMER" | "ORGANIZER";
  referredById?: string;
}) => {
  return prisma.user.create({ data });
};

export const updateUserById = async (
  id: string,
  data: { name?: string; avatarUrl?: string | null }
) => {
  return prisma.user.update({ where: { id }, data });
};

export const updatePasswordById = async (id: string, passwordHash: string) => {
  return prisma.user.update({ where: { id }, data: { passwordHash } });
};

export const findReferralCode = async (code: string) => {
  return prisma.referralCode.findUnique({
    where: { code },
    include: { owner: true },
  });
};

export const createReferralCode = async (userId: string, code: string) => {
  return prisma.referralCode.create({
    data: { code, ownerId: userId },
  });
};

export const incrementReferralUsage = async (referralId: string) => {
  return prisma.referralCode.update({
    where: { id: referralId },
    data: { usedCount: { increment: 1 } },
  });
};

export const findCouponsByUser = async (userId: string) => {
  return prisma.coupon.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const createCoupon = async (
  userId: string,
  code: string,
  discountPercent: number,
  expiredAt: Date
) => {
  return prisma.coupon.create({
    data: { userId, code, discountPercent, expiredAt },
  });
};
