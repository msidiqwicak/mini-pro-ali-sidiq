import { getRedisClient } from "../lib/redis.js";
import logger from "./logger.js";

/**
 * Cache Manager - Handle all redis caching operations
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  nx?: boolean; // Only set if not exists
  ex?: boolean; // Only set if exists
}

/**
 * Get value from cache
 */
export async function getCache<T = unknown>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    logger.error(`Error getting cache key "${key}":`, error);
    return null;
  }
}

/**
 * Set value in cache
 */
export async function setCache<T = unknown>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<boolean> {
  try {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);

    if (options?.ttl) {
      await client.setEx(key, options.ttl, serialized);
    } else {
      await client.set(key, serialized);
    }

    return true;
  } catch (error) {
    logger.error(`Error setting cache key "${key}":`, error);
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string | string[]): Promise<number> {
  try {
    const client = getRedisClient();
    const keys = Array.isArray(key) ? key : [key];

    if (keys.length === 0) {
      return 0;
    }

    return await client.del(keys);
  } catch (error) {
    logger.error(`Error deleting cache:`, error);
    return 0;
  }
}

/**
 * Clear all cache with pattern
 */
export async function clearCachePattern(pattern: string): Promise<number> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    return await client.del(keys);
  } catch (error) {
    logger.error(`Error clearing cache pattern "${pattern}":`, error);
    return 0;
  }
}

/**
 * Check if key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(`Error checking cache existence for key "${key}":`, error);
    return false;
  }
}

/**
 * Get cache TTL (time to live)
 */
export async function getCacheTTL(key: string): Promise<number> {
  try {
    const client = getRedisClient();
    return await client.ttl(key);
  } catch (error) {
    logger.error(`Error getting cache TTL for key "${key}":`, error);
    return -1;
  }
}

/**
 * Increment counter in cache
 */
export async function incrementCache(key: string, amount: number = 1): Promise<number> {
  try {
    const client = getRedisClient();
    return await client.incrBy(key, amount);
  } catch (error) {
    logger.error(`Error incrementing cache key "${key}":`, error);
    return 0;
  }
}

/**
 * Get or set cache (memoization pattern)
 */
export async function getOrSetCache<T = unknown>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await getCache<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit for key "${key}"`);
      return cached;
    }

    // Cache miss - fetch data
    logger.debug(`Cache miss for key "${key}" - fetching data`);
    const data = await fetcher();

    // Store in cache
    await setCache(key, data, { ttl });

    return data;
  } catch (error) {
    logger.error(`Error in getOrSetCache for key "${key}":`, error);
    throw error;
  }
}

/**
 * Batch get multiple cache keys
 */
export async function getBatchCache<T = unknown>(keys: string[]): Promise<(T | null)[]> {
  try {
    const client = getRedisClient();

    if (keys.length === 0) {
      return [];
    }

    const values = await client.mGet(keys);

    return values.map((value) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    });
  } catch (error) {
    logger.error("Error batch getting cache:", error);
    return keys.map(() => null);
  }
}
