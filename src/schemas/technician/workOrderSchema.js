import { z } from "zod";

// Skema validasi untuk input saat teknisi mengupdate work order
export const updateWorkOrderSchema = z.object({
    status: z.enum(["in_progress", "completed"], {
        required_error: "Status is required",
        invalid_type_error: "Status must be one of 'in_progress', or 'completed'",
    }),
    description: z.string(),
    // When status is 'completed', technician can indicate whether the affected asset/machine
    // is repairable (true => set to 'operational', false => set to 'down'). Optional for backward compatibility.
    repairable: z.boolean().optional(),
    started_at: z.coerce.date().optional(),
    completed_at: z.coerce.date().optional(),
});