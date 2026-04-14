import prisma from "../lib/prisma.js";
export const findAllEvents = async (params) => {
    const { search, city, categoryId, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = {
        status: "PUBLISHED",
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
            ],
        }),
        ...(city && { city: { contains: city, mode: "insensitive" } }),
        ...(categoryId && { categoryId }),
    };
    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            skip,
            take: limit,
            orderBy: { startDate: "asc" },
            include: {
                organizer: { select: { id: true, name: true, avatarUrl: true } },
                category: true,
                ticketTypes: true,
                _count: { select: { reviews: true } },
            },
        }),
        prisma.event.count({ where }),
    ]);
    return { events, total };
};
export const findEventBySlug = async (slug) => {
    return prisma.event.findUnique({
        where: { slug },
        include: {
            organizer: { select: { id: true, name: true, avatarUrl: true } },
            category: true,
            ticketTypes: true,
            promotions: {
                where: {
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() },
                },
            },
            reviews: {
                include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            _count: { select: { reviews: true } },
        },
    });
};
export const findEventById = async (id) => {
    return prisma.event.findUnique({
        where: { id },
        include: {
            organizer: { select: { id: true, name: true } },
            category: true,
            ticketTypes: true,
            promotions: true,
            transactions: true,
        },
    });
};
export const findEventsByOrganizer = async (organizerId) => {
    return prisma.event.findMany({
        where: { organizerId },
        orderBy: { createdAt: "desc" },
        include: {
            category: true,
            ticketTypes: true,
            _count: { select: { reviews: true, transactions: true } },
        },
    });
};
export const createEvent = async (data) => {
    return prisma.event.create({ data, include: { category: true, ticketTypes: true } });
};
export const updateEvent = async (id, data) => {
    return prisma.event.update({ where: { id }, data });
};
export const deleteEvent = async (id) => {
    return prisma.event.delete({ where: { id } });
};
export const createTicketTypes = async (ticketTypes) => {
    return prisma.ticketType.createMany({ data: ticketTypes });
};
export const findAllCities = async () => {
    const events = await prisma.event.findMany({
        where: { status: "PUBLISHED" },
        select: { city: true },
        distinct: ["city"],
        orderBy: { city: "asc" },
    });
    return events.map((e) => e.city);
};
export const findAllCategories = async () => {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
};
