import { getRevenueByDay, getRevenueByMonth, getRevenueByYear, getOrganizerStats, } from "../repositories/dashboard.repository.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { findTransactionsByEvent } from "../repositories/transaction.repository.js";
export const getDashboardAnalytics = async (req, res) => {
    try {
        const organizerId = req.user.userId;
        const { type, year, days, eventId } = req.query;
        if (type === "daily") {
            const data = await getRevenueByDay(organizerId, days ? Number(days) : 30);
            successResponse(res, data);
            return;
        }
        if (type === "monthly") {
            const data = await getRevenueByMonth(organizerId, year ? Number(year) : undefined);
            successResponse(res, data);
            return;
        }
        if (type === "yearly") {
            const data = await getRevenueByYear(organizerId);
            successResponse(res, data);
            return;
        }
        if (type === "event-attendees" && eventId) {
            const transactions = await findTransactionsByEvent(eventId);
            successResponse(res, transactions);
            return;
        }
        // Default: overview stats
        const stats = await getOrganizerStats(organizerId);
        successResponse(res, stats);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal mengambil analitik";
        errorResponse(res, msg);
    }
};
