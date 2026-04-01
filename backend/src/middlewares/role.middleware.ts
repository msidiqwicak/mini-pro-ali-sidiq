import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.middleware.js";
import { errorResponse } from "../utils/response.js";

export const roleMiddleware = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, "Unauthorized", 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(res, "Forbidden - Insufficient permissions", 403);
      return;
    }

    next();
  };
};
