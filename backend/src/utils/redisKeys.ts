/**
 * Centralized Redis key constants
 * Prevents typos and makes key management easier
 */

export const REDIS_KEYS = {
  TOKEN_BLACKLIST: (tokenHash: string) => `blacklist:${tokenHash}`,
  RATE_LIMIT: (identifier: string, route: string) => `ratelimit:${identifier}:${route}`,
  CACHE_EVENTS: (filter?: string) => `cache:events${filter ? `:${filter}` : ""}`,
  CACHE_EVENT_BY_SLUG: (slug: string) => `cache:event:${slug}`,
  CACHE_CATEGORIES: "cache:categories",
  CACHE_CITIES: "cache:cities",
  JOB_EMAIL: (jobId: string) => `job:email:${jobId}`,
  JOB_FAILED: (jobId: string) => `job:failed:${jobId}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  HEALTH_CHECK: "health:check",
  // Password reset token (stored as raw token → userId mapping)
  RESET_TOKEN: (token: string) => `reset_token:${token}`,
} as const;

/**
 * Default TTL values (in seconds)
 */
export const REDIS_TTL = {
  SHORT: 60,         // 1 minute - for rate limiting
  MEDIUM: 300,       // 5 minutes - for cache
  LONG: 3600,        // 1 hour - for session
  VERY_LONG: 86400,  // 24 hours - for job tracking
  RESET_TOKEN: 900,  // 15 minutes - for password reset
} as const;
