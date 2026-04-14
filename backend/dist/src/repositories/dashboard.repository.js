import prisma from "../lib/prisma.js";
export const getRevenueByDay = async (organizerId, days = 30) => {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const transactions = await prisma.transaction.findMany({
        where: {
            event: { organizerId },
            status: "PAID",
            paidAt: { gte: from },
        },
        select: { paidAt: true, finalAmount: true },
        orderBy: { paidAt: "asc" },
    });
    // Group by day
    const grouped = {};
    for (const tx of transactions) {
        if (!tx.paidAt)
            continue;
        const key = tx.paidAt.toISOString().split("T")[0];
        grouped[key] = (grouped[key] ?? 0) + tx.finalAmount;
    }
    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
};
export const getRevenueByMonth = async (organizerId, year) => {
    const targetYear = year ?? new Date().getFullYear();
    const from = new Date(`${targetYear}-01-01`);
    const to = new Date(`${targetYear}-12-31`);
    const transactions = await prisma.transaction.findMany({
        where: {
            event: { organizerId },
            status: "PAID",
            paidAt: { gte: from, lte: to },
        },
        select: { paidAt: true, finalAmount: true },
    });
    // Group by month
    const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        label: new Date(targetYear, i, 1).toLocaleString("id-ID", { month: "short" }),
        revenue: 0,
    }));
    for (const tx of transactions) {
        if (!tx.paidAt)
            continue;
        const month = tx.paidAt.getMonth(); // 0-indexed
        if (months[month]) {
            months[month].revenue += tx.finalAmount;
        }
    }
    return months;
};
export const getRevenueByYear = async (organizerId) => {
    const transactions = await prisma.transaction.findMany({
        where: { event: { organizerId }, status: "PAID" },
        select: { paidAt: true, finalAmount: true },
    });
    const grouped = {};
    for (const tx of transactions) {
        if (!tx.paidAt)
            continue;
        const key = String(tx.paidAt.getFullYear());
        grouped[key] = (grouped[key] ?? 0) + tx.finalAmount;
    }
    return Object.entries(grouped).map(([year, revenue]) => ({ year, revenue }));
};
export const getOrganizerStats = async (organizerId) => {
    const [totalEvents, totalRevenue, totalAttendees, recentTransactions] = await Promise.all([
        prisma.event.count({ where: { organizerId } }),
        prisma.transaction.aggregate({
            where: { event: { organizerId }, status: "PAID" },
            _sum: { finalAmount: true },
        }),
        prisma.ticket.count({
            where: { transaction: { event: { organizerId }, status: "PAID" } },
        }),
        prisma.transaction.findMany({
            where: { event: { organizerId }, status: "PAID" },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                user: { select: { name: true, email: true } },
                event: { select: { name: true } },
            },
        }),
    ]);
    return {
        totalEvents,
        totalRevenue: totalRevenue._sum.finalAmount ?? 0,
        totalAttendees,
        recentTransactions,
    };
};
