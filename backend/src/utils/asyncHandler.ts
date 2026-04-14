import type { Request, Response, NextFunction } from "express";

/**
 * Wrapper untuk async route handlers
 * Automatically catches errors dan pass ke error middleware
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
