import prisma from "../lib/prisma.js";
export const findUserByEmail = async (email) => {
    return prisma.user.findUnique({
        where: { email },
        include: { referralCode: true },
    });
};
export const findUserById = async (id) => {
    return prisma.user.findUnique({
        where: { id },
        include: { referralCode: true },
    });
};
export const createUser = async (data) => {
    return prisma.user.create({ data });
};
export const findReferralCode = async (code) => {
    return prisma.referralCode.findUnique({
        where: { code },
        include: { owner: true },
    });
};
export const createReferralCode = async (userId, code) => {
    return prisma.referralCode.create({
        data: { code, ownerId: userId },
    });
};
export const incrementReferralUsage = async (referralId) => {
    return prisma.referralCode.update({
        where: { id: referralId },
        data: { usedCount: { increment: 1 } },
    });
};
