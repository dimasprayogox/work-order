import { z } from 'zod';

export const createScheduleSchema = z.object({
    title: z.string().min(3, "Judul jadwal minimal 3 karakter."),
    description: z.string().optional(),
    machine_id: z.string().uuid("ID mesin tidak valid."),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly'], "Frekuensi tidak valid."),
    next_due_date: z.coerce.date("Tanggal jatuh tempo tidak valid."),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const updateScheduleSchema = z.object({
    title: z.string().min(3, "Judul jadwal minimal 3 karakter.").optional(),
    description: z.string().optional(),
    machine_id: z.string().uuid("ID mesin tidak valid.").optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly'], "Frekuensi tidak valid.").optional(),
    next_due_date: z.coerce.date("Tanggal jatuh tempo tidak valid.").optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
});