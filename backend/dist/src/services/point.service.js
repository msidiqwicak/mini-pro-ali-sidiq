import { findActivePointsByUser } from "../repositories/transaction.repository.js";
export const getAvailablePoints = async (userId) => {
    const points = await findActivePointsByUser(userId);
    const total = points.reduce((sum, p) => sum + p.amount, 0);
    return { points, total };
};
/**
 * Calculate FIFO redemption plan
 * Returns list of { pointId, amountUsed } to deduct
 */
export const calculatePointsRedemption = (points, pointsToUse) => {
    const plan = [];
    let remaining = pointsToUse;
    for (const point of points) {
        if (remaining <= 0)
            break;
        const use = Math.min(remaining, point.amount);
        plan.push({ pointId: point.id, amountUsed: use });
        remaining -= use;
    }
    return plan;
};
