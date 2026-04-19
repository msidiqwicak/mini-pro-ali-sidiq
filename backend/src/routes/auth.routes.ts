import { Router } from "express";
import { register, login, getMe, logout } from "../controllers/auth.controller.js";
import {
  updateProfile,
  changePassword,
  getPoints,
  getCoupons,
} from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getMe);
router.patch("/profile", authMiddleware, updateProfile);
router.patch("/password", authMiddleware, changePassword);
router.get("/points", authMiddleware, getPoints);
router.get("/coupons", authMiddleware, getCoupons);

export default router;
