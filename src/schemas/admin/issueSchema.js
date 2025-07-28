//src/schemas/admin/issueSchema.js
import { z } from "zod";

export const createIssueSchema = z.object({
    machine_id: z.string().uuid({ message: "machine_id harus UUID yang valid" }),
    title: z.string()
        .min(3, { message: "Judul minimal 3 karakter" })
        .max(100, { message: "Judul maksimal 100 karakter" }),
    description: z.string()
        .min(10, { message: "Deskripsi minimal 10 karakter" })
        .max(1000, { message: "Deskripsi maksimal 1000 karakter" }),
    priority: z.enum(["low", "medium", "high", "critical"], {
        message: "Priority harus salah satu dari: low, medium, high, critical"
    }).optional(),
    assigned_to_id: z.string().uuid({ message: "assigned_to_id harus UUID yang valid" }).optional(),
});

export const updateIssueSchema = z.object({
    title: z.string()
        .min(3, { message: "Judul minimal 3 karakter" })
        .max(100, { message: "Judul maksimal 100 karakter" })
        .optional(),
    description: z.string()
        .min(10, { message: "Deskripsi minimal 10 karakter" })
        .max(1000, { message: "Deskripsi maksimal 1000 karakter" })
        .optional(),
    machine_id: z.string().uuid({ message: "machine_id harus UUID yang valid" }).optional(),
    status: z.enum(["open", "in_progress", "resolved", "closed"], {
        message: "Status harus salah satu dari: open, in_progress, resolved, closed"
    }).optional(),
    priority: z.enum(["low", "medium", "high", "critical"], {
        message: "Priority harus salah satu dari: low, medium, high, critical"
    }).optional(),
    assigned_to_id: z.string().uuid({ message: "assigned_to_id harus UUID yang valid" }).nullable().optional(),
});

export const assignIssueSchema = z.object({
    assigned_to_id: z.string().uuid({ message: "assigned_to_id harus UUID yang valid" }),
    priority: z.enum(["low", "medium", "high", "critical"], {
        message: "Priority harus salah satu dari: low, medium, high, critical"
    }).optional(),
});

export const changeStatusSchema = z.object({
    status: z.enum(["open", "in_progress", "resolved", "closed"], {
        message: "Status harus salah satu dari: open, in_progress, resolved, closed"
    }),
});

export const filterIssuesSchema = z.object({
    status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    machine_id: z.string().uuid().optional(),
    assigned_to_id: z.string().uuid().optional(),
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    search: z.string().min(1).optional(),
});