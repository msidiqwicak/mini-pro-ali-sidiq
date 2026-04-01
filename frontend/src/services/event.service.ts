import api from "./api";
import type { ApiResponse, Event, Category, PaginatedResponse } from "../types";

export const eventService = {
  getEvents: async (params?: {
    search?: string;
    city?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<ApiResponse<PaginatedResponse<Event>>>("/events", {
      params,
    });
    return res.data;
  },

  getEventBySlug: async (slug: string) => {
    const res = await api.get<ApiResponse<Event>>(`/events/${slug}`);
    return res.data;
  },

  getOrganizerEvents: async () => {
    const res = await api.get<ApiResponse<Event[]>>("/events/organizer/mine");
    return res.data;
  },

  createEvent: async (data: unknown) => {
    const res = await api.post<ApiResponse<Event>>("/events", data);
    return res.data;
  },

  updateEvent: async (id: string, data: unknown) => {
    const res = await api.patch<ApiResponse<Event>>(`/events/${id}`, data);
    return res.data;
  },

  deleteEvent: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/events/${id}`);
    return res.data;
  },

  getCities: async () => {
    const res = await api.get<ApiResponse<string[]>>("/events/cities");
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get<ApiResponse<Category[]>>("/events/categories");
    return res.data;
  },
};
