import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/env.js";

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export type UploadFolder = "events" | "avatars";

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: UploadFolder
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `soundwave/${folder}`,
        resource_type: "image",
        transformation: [{ width: 1200, crop: "limit" }, { quality: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload gagal, tidak ada result"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};
