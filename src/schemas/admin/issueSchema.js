import { z } from "zod";

export const createIssueAdminSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    machine_id: z.string().uuid("Invalid machine ID"),
    reported_by_id: z.string().uuid("Invalid user ID").optional()
});

export const updateIssueAdminSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().min(1, "Description is required").optional(),
    machine_id: z.string().uuid("Invalid machine ID").optional(),
    reported_by_id: z.string().uuid("Invalid user ID").optional().nullable() // ✅ Tambahkan ini
});