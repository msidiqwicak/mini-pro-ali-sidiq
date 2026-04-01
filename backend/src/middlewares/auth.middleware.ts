import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
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
    req.user = decoded;
    next();
  } catch {
    errorResponse(res, "Unauthorized - Invalid or expired token", 401);
  }
};
