import { Router } from "express";
import { createReview } from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
const router = Router();
router.post("/", authMiddleware, roleMiddleware("CUSTOMER"), createReview);
export default router;
