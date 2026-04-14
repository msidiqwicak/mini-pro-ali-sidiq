import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import router from "./routes/index.js";
import { globalErrorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
const app = express();
// ─── CORS ─────────────────────────────────────────────────────────
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
}));
// ─── Body Parsers ─────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ─── Health Check ─────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// ─── API Routes ───────────────────────────────────────────────────
app.use("/api", router);
// ─── 404 Handler ──────────────────────────────────────────────────
app.use(notFoundHandler);
// ─── Global Error Handler (HARUS DI AKHIR) ───────────────────────
app.use(globalErrorHandler);
export default app;
