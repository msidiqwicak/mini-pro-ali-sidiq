import { Router } from "express";
import { createReview, canReviewController } from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("CUSTOMER"), createReview);
router.get("/can-review/:eventId", authMiddleware, roleMiddleware("CUSTOMER"), canReviewController);

export default router;
