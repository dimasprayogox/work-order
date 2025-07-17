import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter").max(50),
  email: z.string().email("Email tidak valid").max(100),
  password: z.string().min(8, "Password minimal 8 karakter").max(255),
  full_name: z.string().min(3, "Nama lengkap minimal 3 karakter").max(100),
  role: z.enum(["admin", "employee", "technician", "manager", "logistics"], {
    errorMap: () => ({ message: "Role tidak valid" }),
  }).default("employee"),
  is_active: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().max(100).optional(),
  password: z.string().min(8).max(255).optional(),
  full_name: z.string().min(3).max(100).optional(),
  role: z.enum(["admin", "employee", "technician", "manager", "logistics"], {
    errorMap: () => ({ message: "Role tidak valid" }),
  }).optional(),
  is_active: z.boolean().optional(),
});
