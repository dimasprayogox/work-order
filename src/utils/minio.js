import { Client } from "minio"
import dotenv from "dotenv"
dotenv.config()

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: process.env.MINIO_PORT || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
})

export const checkAndCreateBucket = async (bucketName) => {
  try {
    // 1. Cek apakah bucket sudah ada
    const bucketExists = await minioClient.bucketExists(bucketName);

    // 2. Jika tidak ada, buat bucket baru
    if (!bucketExists) {
      console.log(`Bucket "${bucketName}" tidak ditemukan. Membuat bucket...`);
      await minioClient.makeBucket(bucketName);
      console.log(`Bucket "${bucketName}" berhasil dibuat.`);
    } else {
      console.log(`Bucket "${bucketName}" sudah ada.`);
    }
  } catch (err) {
    console.error("Terjadi kesalahan:", err);
  }
};