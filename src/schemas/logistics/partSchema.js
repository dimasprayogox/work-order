import { z } from "zod";

export const createPartSchema = z.object({
    name: z.string().min(2),
    part_number: z.string().min(2),
    description: z.string().optional(),
    quantity_in_stock: z.number().int().min(0),
    min_stock: z.number().int().min(0),
    location: z.string().min(3),
});

export const updatePartSchema = createPartSchema.partial();
