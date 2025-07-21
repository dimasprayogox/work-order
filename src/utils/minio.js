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
    const bucketExists = await minioClient.bucketExists(bucketName)

    if (!bucketExists) {
      console.log(`Bucket "${bucketName}" tidak ditemukan. Membuat bucket...`)
      await minioClient.makeBucket(bucketName, "")
      console.log(`Bucket "${bucketName}" berhasil dibuat.`)
      await setBucketPublic(bucketName)
      return
    }

    console.log(`Bucket "${bucketName}" sudah ada.`)

    // Cek policy bucket
    try {
      const policy = await minioClient.getBucketPolicy(bucketName)
      const isPublic = policy.includes('"Action":["s3:GetObject"]') &&
                       policy.includes('"Principal":"*"')

      if (!isPublic) {
        console.log(`Bucket "${bucketName}" ada, tapi belum public. Mengatur jadi public...`)
        await setBucketPublic(bucketName)
      } else {
        console.log(`Bucket "${bucketName}" sudah public.`)
      }
    } catch (err) {
      console.log(`Tidak ada policy atau tidak bisa mengambil policy. Mengatur jadi public...`)
      await setBucketPublic(bucketName)
    }
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