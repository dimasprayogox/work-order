// src/schemas/admin/partSchema.js
import { z } from "zod";

export const createPartSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    part_number: z
        .string()
        .min(2, "Part number must be at least 2 characters long"),
    description: z.string().optional(),
    quantity_in_stock: z
        .number()
        .int()
        .min(0, "Quantity in stock must be a non-negative integer"),
    min_stock: z
        .number()
        .int()
        .min(0, "Minimum stock must be a non-negative integer"),
    location: z.string().min(3, "Location must be at least 3 characters long"),
});

export const updatePartSchema = createPartSchema.partial();
