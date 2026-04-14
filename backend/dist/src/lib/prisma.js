import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
const globalForPrisma = globalThis;
function createPrismaClient() {
    const connectionString = process.env["DATABASE_URL"];
    if (!connectionString) {
        throw new Error("❌ DATABASE_URL tidak ditemukan di .env");
    }
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}
const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env["NODE_ENV"] !== "production") {
    globalForPrisma.prisma = prisma;
}
export default prisma;
