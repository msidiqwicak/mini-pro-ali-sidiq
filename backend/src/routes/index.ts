import { Router } from "express";
import authRoutes from "./auth.routes.js";
import eventRoutes from "./event.routes.js";
import transactionRoutes from "./transaction.routes.js";
import reviewRoutes from "./review.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import uploadRoutes from "./upload.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/events", eventRoutes);
router.use("/transactions", transactionRoutes);
router.use("/reviews", reviewRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/upload", uploadRoutes);

export default router;
