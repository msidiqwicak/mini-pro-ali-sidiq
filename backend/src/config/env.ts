import "dotenv/config";

export const config = {
  port: Number(process.env["PORT"]) || 5000,
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  jwtSecret: process.env["JWT_SECRET"] ?? "fallback-secret-change-in-production",
  jwtExpiresIn: process.env["JWT_EXPIRES_IN"] ?? "30m",
  frontendUrl: process.env["FRONTEND_URL"] ?? "http://localhost:5173",

  // Email Configuration
  smtp: {
    host: process.env["SMTP_HOST"] ?? "smtp.gmail.com",
    port: Number(process.env["SMTP_PORT"]) || 587,
    user: process.env["SMTP_USER"] ?? "",
    pass: process.env["SMTP_PASS"] ?? "",
    from: process.env["SMTP_FROM"] ?? "noreply@eventplatform.com",
  },

  // 🆕 Upstash Redis Configuration (HTTP-based, works on Vercel)
  redis: {
    url: process.env["UPSTASH_REDIS_REST_URL"] ?? "",
    token: process.env["UPSTASH_REDIS_REST_TOKEN"] ?? "",
  },
} as const;
