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
} from "../controllers/event.controller.js";
import { getEventReviews } from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

// Public
router.get("/", getEvents);
router.get("/cities", getCities);
router.get("/categories", getCategories);
router.get("/:slug", getEventBySlug);
router.get("/:id/reviews", getEventReviews);

// Organizer only
router.get(
  "/organizer/mine",
  authMiddleware,
  roleMiddleware("ORGANIZER"),
  getOrganizerEvents
);
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

export default router;
