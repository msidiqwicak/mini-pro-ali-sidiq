import "dotenv/config";
import app from "./app.js";
import { config } from "./config/env.js";
import prisma from "./lib/prisma.js";
import { initializeRedis, testRedisConnection } from "./lib/redis.js";
import { testEmailConnection } from "./utils/mail.js";
import logger from "./utils/logger.js";
// Test koneksi database dulu sebelum buka server
async function main() {
    try {
        // Cek koneksi Prisma ke Supabase
        await prisma.$connect();
        logger.info("✅ Database terhubung");
        // 🆕 Initialize dan test Redis connection
        await initializeRedis();
        await testRedisConnection();
        // Test email connection
        await testEmailConnection();
        // Buka server
        const server = app.listen(config.port, () => {
            logger.info(`🎵 SoundWave API running on http://localhost:${config.port}`);
            logger.info(`🌍 Environment: ${config.nodeEnv}`);
            logger.info(`📡 Frontend allowed: ${config.frontendUrl}`);
            logger.info(`📧 Email from: ${config.smtp.from}`);
            logger.info(`🔴 Redis: ${config.redis.url}`);
        });
        // Handle error saat listen
        server.on("error", (err) => {
            logger.error("❌ Server error:", err);
            process.exit(1);
        });
    }
    catch (err) {
        logger.error("❌ Gagal koneksi database, Redis, atau email:", err);
        await prisma.$disconnect();
        process.exit(1);
    }
}
// Handle unhandled errors
process.on("unhandledRejection", (err) => {
    logger.error("❌ Unhandled Rejection:", err);
    process.exit(1);
});
process.on("uncaughtException", (err) => {
    logger.error("❌ Uncaught Exception:", err);
    process.exit(1);
});
void main();
