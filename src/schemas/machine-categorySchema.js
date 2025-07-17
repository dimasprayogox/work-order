import { z } from "zod";

export const createMachineCategorySchema = z.object({
  name: z.string().min(3, "Nama kategori minimal 3 karakter"),
  description: z.string().max(255, "Deskripsi maksimal 255 karakter").optional(),
});

export const updateMachineCategorySchema = z.object({
  name: z.string().min(3, "Nama kategori minimal 3 karakter").optional(),
  description: z.string().max(255, "Deskripsi maksimal 255 karakter").optional(),
});
