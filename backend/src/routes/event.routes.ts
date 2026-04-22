import { Router } from "express";
import {
  getEvents,
  getEventBySlug,
  createEventController,
  updateEventController,
  deleteEventController,
  getOrganizerEvents,
  getCities,
  getCategories,
  getOrganizerPublicProfile,
  getEventPromotions,
  createPromotion,
  deletePromotion,
} from "../controllers/event.controller.js";
import { getEventReviews } from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

// Public
router.get("/", getEvents);
router.get("/cities", getCities);
router.get("/categories", getCategories);
// NOTE: /organizer/mine MUST be before /organizer/:id to avoid route conflict
router.get(
  "/organizer/mine",
  authMiddleware,
  roleMiddleware("ORGANIZER"),
  getOrganizerEvents
);
router.get("/organizer/:id", getOrganizerPublicProfile);
router.get("/:slug", getEventBySlug);
router.get("/:id/reviews", getEventReviews);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ORGANIZER"),
  createEventController
);
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("ORGANIZER"),
  updateEventController
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ORGANIZER"),
  deleteEventController
);

// Promotions (organizer only)
router.get("/:eventId/promotions", authMiddleware, roleMiddleware("ORGANIZER"), getEventPromotions);
router.post("/:eventId/promotions", authMiddleware, roleMiddleware("ORGANIZER"), createPromotion);
router.delete("/:eventId/promotions/:promoId", authMiddleware, roleMiddleware("ORGANIZER"), deletePromotion);

export default router;
