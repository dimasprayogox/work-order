import { z } from "zod";

// Skema validasi untuk input saat teknisi mengupdate work order
export const updateWorkOrderSchema = z.object({
    status: z.enum(["in_progress", "completed"], {
        required_error: "Status is required",
        invalid_type_error: "Status must be one of 'in_progress', or 'completed'",
    }),
    description: z.string(),
    started_at: z.coerce.date().optional(),
    completed_at: z.coerce.date().optional(),
});