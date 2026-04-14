import type { Request, Response, NextFunction } from "express";
import { isAppError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * Global Error Handler Middleware
 * Harus dipasang paling akhir setelah semua route
 */
export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Generate error ID untuk tracking
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Determine if error is operational (expected) or programming error (unexpected)
  if (isAppError(err)) {
    // Operational error - dari application logic
    const statusCode = err.statusCode;

    // Log based on level
    if (statusCode >= 500) {
      logger.error({
        errorId,
        message: err.message,
        statusCode,
        stack: err.stack,
        context: err.context,
        path: _req.path,
        method: _req.method,
      });
    } else {
      logger.warn({
        errorId,
        message: err.message,
        statusCode,
        path: _req.path,
        method: _req.method,
      });
    }

    res.status(statusCode).json({
      success: false,
      message: err.message,
      errorId,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  } else {
    // Programming error - tidak terduga
    logger.error({
      errorId,
      message: "Unhandled Error",
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      path: _req.path,
      method: _req.method,
    });

    // Don't expose internal error details to client
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorId,
      ...(process.env.NODE_ENV === "development" && {
        error: err instanceof Error ? err.message : String(err),
      }),
    });
  }
};

/**
 * 404 Handler - dipanggil jika tidak ada route match
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: "Route tidak ditemukan",
    path: _req.path,
    method: _req.method,
  });
};
