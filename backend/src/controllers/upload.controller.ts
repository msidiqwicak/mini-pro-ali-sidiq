import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadToCloudinary, type UploadFolder } from "../utils/cloudinary.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const uploadImage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.file) {
    errorResponse(res, "Tidak ada file yang diupload", 400);
    return;
  }

  // Tentukan folder berdasarkan query param ?folder=events atau ?folder=avatars
  const folderParam = (req.query["folder"] as string) ?? "events";
  const folder: UploadFolder =
    folderParam === "avatars" ? "avatars" : "events";

  try {
    const url = await uploadToCloudinary(req.file.buffer, folder);
    successResponse(res, { url }, "Upload berhasil", 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload gagal";
    errorResponse(res, msg, 500);
  }
};
