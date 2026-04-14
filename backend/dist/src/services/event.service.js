import { z } from "zod";
import { findAllEvents, findEventBySlug, findEventById, findEventsByOrganizer, createEvent, updateEvent, deleteEvent, createTicketTypes, findAllCities, findAllCategories, } from "../repositories/event.repository.js";
import { generateSlug } from "../utils/slug.js";
export const createEventSchema = z.object({
    categoryId: z.string().min(1, "Kategori wajib dipilih"),
    name: z.string().min(3, "Nama event minimal 3 karakter"),
    description: z.string().min(20, "Deskripsi minimal 20 karakter"),
    location: z.string().min(3, "Lokasi wajib diisi"),
    city: z.string().min(2, "Kota wajib diisi"),
    imageUrl: z.string().url("URL gambar tidak valid").optional().or(z.literal("")),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi").refine((v) => !isNaN(Date.parse(v)), "Format tanggal tidak valid"),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi").refine((v) => !isNaN(Date.parse(v)), "Format tanggal tidak valid"),
    isFree: z.boolean().default(false),
    totalSeats: z.number().int().positive("Jumlah kursi harus positif"),
    status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
    ticketTypes: z
        .array(z.object({
        name: z.string().min(1, "Nama tiket wajib diisi"),
        description: z.string().optional(),
        price: z.number().int().min(0, "Harga tidak boleh negatif"),
        quota: z.number().int().positive("Kuota harus positif"),
    }))
        .min(1, "Minimal 1 tipe tiket"),
});
export const updateEventSchema = createEventSchema.partial().omit({ ticketTypes: true });
export const getEventsService = async (params) => {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(20, Math.max(1, params.limit ?? 9));
    const { events, total } = await findAllEvents({
        search: params.search,
        city: params.city,
        categoryId: params.categoryId,
        page,
        limit,
    });
    return {
        data: events,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
export const getEventBySlugService = async (slug) => {
    const event = await findEventBySlug(slug);
    if (!event)
        throw new Error("Event tidak ditemukan");
    return event;
};
export const createEventService = async (organizerId, input) => {
    const slug = generateSlug(input.name);
    const { ticketTypes, ...eventData } = input;
    const event = await createEvent({
        organizerId,
        ...eventData,
        slug,
        imageUrl: eventData.imageUrl ?? undefined,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
    });
    if (ticketTypes.length > 0) {
        await createTicketTypes(ticketTypes.map((tt) => ({ ...tt, eventId: event.id })));
    }
    return findEventById(event.id);
};
export const updateEventService = async (id, organizerId, input) => {
    const event = await findEventById(id);
    if (!event)
        throw new Error("Event tidak ditemukan");
    if (event.organizer.id !== organizerId)
        throw new Error("Tidak memiliki akses untuk mengubah event ini");
    const { startDate, endDate, ...rest } = input;
    return updateEvent(id, {
        ...rest,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
    });
};
export const deleteEventService = async (id, organizerId) => {
    const event = await findEventById(id);
    if (!event)
        throw new Error("Event tidak ditemukan");
    if (event.organizer.id !== organizerId)
        throw new Error("Tidak memiliki akses untuk menghapus event ini");
    if (event.transactions.length > 0)
        throw new Error("Event yang sudah memiliki transaksi tidak dapat dihapus");
    return deleteEvent(id);
};
export const getOrganizerEventsService = async (organizerId) => {
    return findEventsByOrganizer(organizerId);
};
export const getCitiesService = async () => findAllCities();
export const getCategoriesService = async () => findAllCategories();
