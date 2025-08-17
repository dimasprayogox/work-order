import { z } from "zod";

export const createIssueSchema = z.object({
    machine_id: z.string().uuid({ message: "machine_id must be a valid UUID" }).optional(),
    asset_id: z.string().uuid({ message: "asset_id must be a valid UUID" }).optional(),
    title: z.string().min(3, { message: "Title must be at least 3 characters long" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
    priority: z.enum(["low", "medium", "high"], { message: "Priority must be low, medium, or high" }).default("medium"),
}).refine(data => data.machine_id || data.asset_id, {
    message: "Either machine_id or asset_id must be provided",
    path: ["machine_id"]
});

export const updateIssueSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long" }).max(100).optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }).max(500).optional(),
  machine_id: z.string().uuid({ message: "machine_id must be a valid UUID" }).optional(),
  asset_id: z.string().uuid({ message: "asset_id must be a valid UUID" }).optional(),
  priority: z.enum(["low", "medium", "high"], { message: "Priority must be low, medium, or high" }).optional(),
}).refine(data => {
    // If both are provided, that's an error
    if (data.machine_id && data.asset_id) {
        return false;
    }
    return true;
}, {
    message: "Cannot specify both machine_id and asset_id at the same time",
    path: ["machine_id"]
});