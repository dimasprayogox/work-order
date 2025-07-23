import { z } from "zod";

export const createPartRequestSchema = z.object({
    workOrderId: z.string().uuid(),
    note: z.string().optional(),
    items: z.array(
        z.object({
            partId: z.string().uuid(),
            quantityRequested: z.number().int().positive()
        })
    ).min(1, "At least one item must be requested")
});
