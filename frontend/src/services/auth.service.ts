import api from "./api";
import type { ApiResponse, User, Point, Coupon } from "../types";

interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  register: async (data: {
    email: string;
    name: string;
    password: string;
    role: "CUSTOMER" | "ORGANIZER";
    referralCode?: string;
  }) => {
    const res = await api.post<ApiResponse<AuthResponse>>("/auth/register", data);
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<User>>("/auth/me");
    return res.data;
  },

  updateProfile: async (data: { name?: string; avatarUrl?: string }) => {
    const res = await api.patch<ApiResponse<User>>("/auth/profile", data);
    return res.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const res = await api.patch<ApiResponse<{ message: string }>>("/auth/password", data);
    return res.data;
  },

  getPoints: async () => {
    const res = await api.get<ApiResponse<{ points: Point[]; total: number }>>(
      "/auth/points"
    );
    return res.data;
  },

  getCoupons: async () => {
    const res = await api.get<ApiResponse<{ coupons: Coupon[] }>>(
      "/auth/coupons"
    );
    return res.data;
  },
};

