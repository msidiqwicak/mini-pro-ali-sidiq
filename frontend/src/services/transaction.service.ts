import api from "./api";
import type { ApiResponse, Transaction, Point } from "../types";

export const transactionService = {
  createTransaction: async (data: {
    eventId: string;
    ticketTypeId: string;
    quantity: number;
    promotionCode?: string;
    pointsToUse?: number;
  }) => {
    const res = await api.post<ApiResponse<Transaction>>("/transactions", data);
    return res.data;
  },

  getMyTransactions: async () => {
    const res = await api.get<ApiResponse<Transaction[]>>("/transactions/me");
    return res.data;
  },

  payTransaction: async (id: string, paymentProofUrl: string) => {
    const res = await api.patch<ApiResponse<Transaction>>(`/transactions/${id}/pay`, { paymentProofUrl });
    return res.data;
  },

  approveTransaction: async (id: string) => {
    const res = await api.patch<ApiResponse<Transaction>>(`/transactions/${id}/approve`);
    return res.data;
  },

  rejectTransaction: async (id: string) => {
    const res = await api.patch<ApiResponse<{ message: string }>>(`/transactions/${id}/reject`);
    return res.data;
  },

  getMyPoints: async () => {
    const res = await api.get<ApiResponse<{ points: Point[]; total: number }>>(
      "/transactions/points"
    );
    return res.data;
  },
};
