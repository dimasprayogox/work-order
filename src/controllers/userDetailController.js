import {
  getUserDetailByUserId,
  updateUserProfile,
} from "../models/userDetailModel.js";
import { minioClient, checkAndCreateBucket, getMinioPublicUrl } from "../utils/minio.js";
import path from "path";
import { updateProfileSchema } from "../schemas/userDetailSchema.js";
import dotenv from "dotenv"
dotenv.config()

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

export const show = async (req, res) => {
  try {
    const userId = req.user.userId; // dari JWT middleware
    const detail = await getUserDetailByUserId(userId);
    if (!detail)
      return res.status(404).json({ message: "Detail tidak ditemukan" });
  // If model now returns division_name, include it in response as-is
  console.log('Fetched user detail for', userId, 'division_name=', detail.division_name);
  res.json({ message: "Success", data: detail });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const userId = req.user.userId;

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

     if (req.file) {
      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          message: "Validasi gagal",
          errors: { photo: ["Ukuran file maksimal adalah 1MB."] },
        });
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({
          message: "Validasi gagal",
          errors: { photo: ["Hanya format .jpg dan .png yang didukung."] },
        });
      }
    }

    const body = parsed.data;

    const userData = {};
    const detailsData = {};

    const userFields = ["username", "full_name", "email"];
    const detailFields = [
      "phone_number",
      "address",
      "city",
      "country",
      "date_of_birth",
      "bio",
    ];

    userFields.forEach((field) => {
      if (body[field] !== undefined) {
        userData[field] = body[field];
      }
    });

    detailFields.forEach((field) => {
      if (body[field] !== undefined) {
        detailsData[field] = body[field];
      }
    });

    // Upload foto profil jika ada
    if (req.file) {
      const bucketName = process.env.MINIO_BUCKET_NAME;
      const folderName = "photo-profile";

      await checkAndCreateBucket(bucketName);

      const photoId = userId;
      const originalFileName = `${photoId}${path.extname(req.file.originalname)}`;
      const objectName = `${folderName}/${originalFileName}`;

      await minioClient.putObject(
        bucketName,
        objectName,
        req.file.buffer,
        req.file.size,
        {
          "Content-Type": req.file.mimetype,
        }
      );

      const photoUrl = `${getMinioPublicUrl()}/${bucketName}/${objectName}`;
      detailsData.profile_photo_url = photoUrl; // simpan di tabel user_details
    }

    if (
      Object.keys(userData).length === 0 &&
      Object.keys(detailsData).length === 0
    ) {
      return res.status(400).json({ message: "Tidak ada data valid untuk diperbarui." });
    }

    console.log("Data yang akan diperbarui:", {
      userId,
      userData,
      detailsData,
    });

    const updatedProfile = await updateUserProfile(
      userId,
      userData,
      detailsData
    );

  // updatedProfile will include division_name thanks to the model change
  res.json({ message: "Profil berhasil diperbarui", data: updatedProfile });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email sudah digunakan." });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};