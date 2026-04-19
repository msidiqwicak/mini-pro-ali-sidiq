import { Redis } from "@upstash/redis";
import logger from "../utils/logger.js";

let client: Redis | null = null;

/**
 * Initialize Upstash Redis client (HTTP-based, works on Vercel/serverless)
 */
export function initializeRedis(): Redis {
  if (client) return client;

  const url = process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"];

  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN harus diisi di .env"
    );
  }

  client = new Redis({ url, token });
  logger.info("✅ Upstash Redis client initialized");

  return client;
}

/**
 * Get Redis client instance (must be initialized first)
 */
export function getRedisClient(): Redis {
  if (!client) {
    throw new Error("Redis client not initialized. Call initializeRedis() first.");
  }
  return client;
}

/**
 * Test Upstash Redis connection via PING
 */
export async function testRedisConnection(): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.ping();
    logger.info("✅ Upstash Redis ping successful");
  } catch (error) {
    logger.error("❌ Upstash Redis connection test failed:", error);
    throw error;
  }
}

/**
 * Clear client (Upstash is HTTP-based, no persistent connection to close)
 */
export async function disconnectRedis(): Promise<void> {
  client = null;
  logger.info("Upstash Redis client cleared");
}

export default getRedisClient;
