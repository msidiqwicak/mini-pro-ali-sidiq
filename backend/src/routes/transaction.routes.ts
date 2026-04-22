import { Router } from "express";
import {
  createTransaction,
  getMyTransactions,
  payTransaction,
  approveTransaction,
  rejectTransaction,
  getMyPoints,
} from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/me", getMyTransactions);
router.get("/points", getMyPoints);

// Customer: upload bukti transfer
router.patch("/:id/pay", payTransaction);

// Organizer: setujui atau tolak
router.patch("/:id/approve", roleMiddleware("ORGANIZER"), approveTransaction);
router.patch("/:id/reject", roleMiddleware("ORGANIZER"), rejectTransaction);

export default router;
