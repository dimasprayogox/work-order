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

// Helper function to get the public URL
export const getMinioPublicUrl = () => {
  return process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT || "localhost"}:${process.env.MINIO_PORT || 9000}`
}

// Helper function to transform old localhost URLs to new public URLs
export const transformMinioUrl = (url) => {
  if (!url) return null;
  
  const newPublicUrl = getMinioPublicUrl();
  
  // Check if URL contains localhost patterns and replace them
  const localhostPatterns = [
    'http://localhost:9000',
    'http://127.0.0.1:9000'
  ];
  
  for (const pattern of localhostPatterns) {
    if (url.includes(pattern)) {
      return url.replace(pattern, newPublicUrl);
    }
  }
  
  return url;
}

export const checkAndCreateBucket = async (bucketName) => {
  try {
    const bucketExists = await minioClient.bucketExists(bucketName)

    if (!bucketExists) {
      console.log(`Bucket "${bucketName}" tidak ditemukan. Membuat bucket...`)
      await minioClient.makeBucket(bucketName, "")
      console.log(`Bucket "${bucketName}" berhasil dibuat.`)
      console.log("Menerapkan policy public-read untuk bucket ini...")
      await setBucketPublic(bucketName)
      return
    }

    console.log(`Bucket "${bucketName}" sudah ada.`)

  } catch (err) {
    console.error("Terjadi kesalahan:", err)
  }
}

const setBucketPublic = async (bucketName) => {
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
      }
    ]
  }
  await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy))
  console.log(`Policy public-read diterapkan untuk bucket "${bucketName}".`)
}