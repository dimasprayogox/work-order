import { z } from 'zod';

export const createScheduleSchema = z.object({
    title: z.string().min(3),
    machine_id: z.string().uuid(),
    description: z.string().optional(),
    frequency: z.enum(['weekly', 'monthly']),
    next_due_date: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "next_due_date harus berupa tanggal valid (ISO 8601)"
    )
    .transform((val) => new Date(val).toISOString()), // pastikan jadi format ISO
});

export const updateScheduleSchema = z.object({
    title: z.string().min(3).optional(),
    machine_id: z.string().uuid().optional(),
    description: z.string().optional(),
    frequency: z.enum(['weekly', 'monthly']).optional(),
    next_due_date: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "next_due_date harus berupa tanggal valid (ISO 8601)"
    )
    .transform((val) => new Date(val).toISOString()), // pastikan jadi format ISO
});
