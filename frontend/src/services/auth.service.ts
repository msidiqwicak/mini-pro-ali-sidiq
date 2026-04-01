import api from "./api";
import type { ApiResponse, User } from "../types";

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
};
