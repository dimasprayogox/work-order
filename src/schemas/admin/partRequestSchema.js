// src/schemas/logistic/partRequestSchema.js
import { z } from "zod";

export const updatePartRequestStatusSchema = z.object({
    status: z.enum(["approved", "rejected", "fulfilled"]),
    note: z.string().optional(),
    items: z
        .array(
            z.object({
                item_id: z.string().uuid(),
                approved_quantity: z.number().int().min(0).optional(),
                note: z.string().optional(),
            })
        )
        .optional(),
});
