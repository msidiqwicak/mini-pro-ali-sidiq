import { createClient } from "redis";
import logger from "../utils/logger.js";
let client = null;
/**
 * Initialize Redis client
 */
export async function initializeRedis() {
    if (client) {
        return client;
    }
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    client = createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    logger.error("Redis reconnection attempts exceeded");
                    return new Error("Redis max retries exceeded");
                }
                return retries * 100;
            },
        },
    });
    // Event listeners
    client.on("error", (err) => logger.error("Redis Client Error:", err));
    client.on("connect", () => logger.info("✅ Redis client connected"));
    client.on("ready", () => logger.info("✅ Redis client ready"));
    client.on("reconnecting", () => logger.warn("⚠️ Redis client reconnecting..."));
    client.on("end", () => logger.warn("⚠️ Redis client disconnected"));
    try {
        await client.connect();
        logger.info("✅ Redis connection established");
        return client;
    }
    catch (error) {
        logger.error("❌ Failed to connect to Redis:", error);
        throw error;
    }
}
/**
 * Get Redis client instance (must be initialized first)
 */
export function getRedisClient() {
    if (!client) {
        throw new Error("Redis client not initialized. Call initializeRedis() first.");
    }
    return client;
}
/**
 * Test Redis connection
 */
export async function testRedisConnection() {
    try {
        const redisClient = getRedisClient();
        await redisClient.ping();
        logger.info("✅ Redis ping successful");
    }
    catch (error) {
        logger.error("❌ Redis connection test failed:", error);
        throw error;
    }
}
/**
 * Disconnect Redis client
 */
export async function disconnectRedis() {
    if (client) {
        await client.disconnect();
        client = null;
        logger.info("Redis client disconnected");
    }
}
export default getRedisClient;
