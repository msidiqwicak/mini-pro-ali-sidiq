import { Router } from "express";
import { getDashboardAnalytics } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
const router = Router();
router.get("/analytics", authMiddleware, roleMiddleware("ORGANIZER"), getDashboardAnalytics);
export default router;
