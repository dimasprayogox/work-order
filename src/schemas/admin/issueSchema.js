import { z } from "zod";

export const createIssueAdminSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    type: z.enum(["machine", "asset"], "Type must be either machine or asset"),
    machine_id: z.string().uuid("Invalid machine ID").optional().nullable(),
    asset_id: z.string().uuid("Invalid asset ID").optional().nullable(),
    reported_by_id: z.string().uuid("Invalid user ID").optional(),
    priority: z.enum(["low", "medium", "high"]).optional().default("medium")
}).refine((data) => {
    // Ensure only one of machine_id or asset_id is provided based on type
    if (data.type === "machine") {
        return !!data.machine_id && !data.asset_id;
    } else if (data.type === "asset") {
        return !!data.asset_id && !data.machine_id;
    }
    return false;
}, {
    message: "Either machine_id or asset_id must be provided based on selected type, but not both",
    path: ["type"]
});

export const updateIssueAdminSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().min(1, "Description is required").optional(),
    type: z.enum(["machine", "asset"], "Type must be either machine or asset").optional(),
    machine_id: z.string().uuid("Invalid machine ID").optional().nullable(),
    asset_id: z.string().uuid("Invalid asset ID").optional().nullable(),
    reported_by_id: z.string().uuid("Invalid user ID").optional().nullable(),
    priority: z.enum(["low", "medium", "high"]).optional()
}).refine((data) => {
    // If type is provided, validate the corresponding ID
    if (data.type) {
        if (data.type === "machine") {
            return data.machine_id && !data.asset_id;
        } else if (data.type === "asset") {
            return data.asset_id && !data.machine_id;
        }
    }
    // If type is not provided, we don't need to validate IDs
    return true;
}, {
    message: "Either machine_id or asset_id must be provided based on selected type, but not both",
    path: ["type"]
});