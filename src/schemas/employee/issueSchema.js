import { z } from "zod";

export const createIssueSchema = z.object({
    machine_id: z.string().uuid({ message: "machine_id harus UUID" }).optional(),
    asset_id: z.string().uuid({ message: "asset_id harus UUID" }).optional(),
    title: z.string().min(3, { message: "Judul minimal 3 karakter" }),
    description: z.string().min(10, { message: "Deskripsi minimal 10 karakter" }),
    priority: z.enum(["low", "medium", "high"], { message: "Priority harus low, medium, atau high" }).default("medium"),
}).refine(data => data.machine_id || data.asset_id, {
    message: "Salah satu dari machine_id atau asset_id harus diisi",
    path: ["machine_id"]
});

export const updateIssueSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(5).max(500).optional(),
  machine_id: z.string().uuid().optional(),
  asset_id: z.string().uuid().optional(),
  priority: z.enum(["low", "medium", "high"], { message: "Priority harus low, medium, atau high" }).optional(),
}).refine(data => {
    // If both are provided, that's an error
    if (data.machine_id && data.asset_id) {
        return false;
    }
    return true;
}, {
    message: "Tidak boleh mengisi machine_id dan asset_id secara bersamaan",
    path: ["machine_id"]
});