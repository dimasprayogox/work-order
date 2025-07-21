import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  full_name: z.string().min(3).max(100).optional(),
  email: z.string().email("Email tidak valid").optional(),
  phone_number: z.string().min(8).max(20).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
  bio: z.string().max(500).optional(),
});