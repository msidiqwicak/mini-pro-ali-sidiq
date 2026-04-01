import "dotenv/config";

export const config = {
  port: Number(process.env["PORT"]) || 5000,
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  jwtSecret: process.env["JWT_SECRET"] ?? "fallback-secret-change-in-production",
  jwtExpiresIn: process.env["JWT_EXPIRES_IN"] ?? "7d",
  frontendUrl: process.env["FRONTEND_URL"] ?? "http://localhost:5173",
} as const;
