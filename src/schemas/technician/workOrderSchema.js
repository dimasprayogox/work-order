import { z } from "zod";

// Skema validasi untuk input saat teknisi mengupdate work order
export const updateWorkOrderSchema = z.object({
    status: z.enum(["pending", "in_progress", "completed"], {
        required_error: "Status is required",
        invalid_type_error: "Status must be one of 'pending', 'in_progress', or 'completed'",
    }),
    description: z.string({
        required_error: "Description is required",
    }).min(10, { message: "Description must be at least 10 characters long" }),
});