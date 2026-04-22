import { Router } from "express";
import { getEventTickets, scanTicket } from "../controllers/ticket.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware("ORGANIZER"));

// GET /tickets/event/:eventId — list all paid tickets for an event (for attendance)
router.get("/event/:eventId", getEventTickets);

// PATCH /tickets/:ticketId/scan — mark ticket as used (attendee check-in)
router.patch("/:ticketId/scan", scanTicket);

export default router;
