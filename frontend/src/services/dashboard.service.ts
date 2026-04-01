import api from "./api";
import type { ApiResponse } from "../types";

export const dashboardService = {
  getOverview: async () => {
    const res = await api.get<
      ApiResponse<{
        totalEvents: number;
        totalRevenue: number;
        totalAttendees: number;
        recentTransactions: unknown[];
      }>
    >("/dashboard/analytics");
    return res.data;
  },

  getDailyRevenue: async (days = 30) => {
    const res = await api.get<ApiResponse<{ date: string; revenue: number }[]>>(
      "/dashboard/analytics",
      { params: { type: "daily", days } }
    );
    return res.data;
  },

  getMonthlyRevenue: async (year?: number) => {
    const res = await api.get<
      ApiResponse<{ month: number; label: string; revenue: number }[]>
    >("/dashboard/analytics", { params: { type: "monthly", year } });
    return res.data;
  },

  getYearlyRevenue: async () => {
    const res = await api.get<ApiResponse<{ year: string; revenue: number }[]>>(
      "/dashboard/analytics",
      { params: { type: "yearly" } }
    );
    return res.data;
  },
};
