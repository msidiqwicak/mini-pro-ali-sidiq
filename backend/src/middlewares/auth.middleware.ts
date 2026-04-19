import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";
import { getCache } from "../utils/cacheManager.js";
import { REDIS_KEYS } from "../utils/redisKeys.js";
import { createHash } from "crypto";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    errorResponse(res, "Unauthorized - No token provided", 401);
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    errorResponse(res, "Unauthorized - Invalid token format", 401);
    return;
  }

  try {
    const decoded = verifyToken(token);

    // Cek apakah token sudah di-blacklist (logout sebelumnya)
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const isBlacklisted = await getCache(REDIS_KEYS.TOKEN_BLACKLIST(tokenHash));
    if (isBlacklisted) {
      errorResponse(res, "Unauthorized - Token sudah tidak valid (logout)", 401);
      return;
    }

    req.user = decoded;
    next();
  } catch {
    errorResponse(res, "Unauthorized - Invalid or expired token", 401);
  }
};
