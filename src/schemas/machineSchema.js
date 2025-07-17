import { z } from 'zod';

export const createMachineSchema = z.object({
    name: z.string().min(3, "Nama mesin minimal 3 karakter"),
    description: z.string().max(255, "Deskripsi maksimal 255 karakter").optional(),
    category_id: z.string().uuid("Kategori ID harus berupa UUID yang valid"),
});

export const updateMachineSchema = z.object({
    name: z.string().min(3, "Nama mesin minimal 3 karakter").optional(),
    description: z.string().max(255, "Deskripsi maksimal 255 karakter").optional(),
    category_id: z.string().uuid("Kategori ID harus berupa UUID yang valid").optional(),
});
