import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadSingle } from "../middlewares/upload.middleware.js";
import { uploadImage } from "../controllers/upload.controller.js";

const router = Router();

// POST /api/upload?folder=events  → upload gambar event ke Cloudinary
// POST /api/upload?folder=avatars → upload foto profil ke Cloudinary
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    // Jalankan multer — tangani error multer (ukuran/format file)
    uploadSingle(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      next();
    });
  },
  uploadImage
);

export default router;
