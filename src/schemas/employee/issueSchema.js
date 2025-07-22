import { z } from "zod";

export const createIssueSchema = z.object({
    machine_id: z.string().uuid({ message: "machine_id harus UUID" }),
    title: z.string().min(3, { message: "Judul minimal 3 karakter" }),
    description: z.string().min(10, { message: "Deskripsi minimal 10 karakter" }),
});

export const updateIssueSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(5).max(500).optional(),
  machine_id: z.string().uuid().optional(),
});