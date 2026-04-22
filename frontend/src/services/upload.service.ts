import api from "./api";

export type UploadFolder = "events" | "avatars";

/**
 * Upload sebuah file gambar ke Cloudinary melalui backend.
 * @param file - File yang dipilih user
 * @param folder - "events" untuk gambar event, "avatars" untuk foto profil
 * @returns URL Cloudinary (secure_url)
 */
export const uploadImage = async (
  file: File,
  folder: UploadFolder = "events"
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<{ success: boolean; data: { url: string } }>(
    `/upload?folder=${folder}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return res.data.data.url;
};
