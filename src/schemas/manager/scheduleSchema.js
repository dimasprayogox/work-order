import { z } from 'zod';

export const createScheduleSchema = z.object({
    title: z.string().min(3),
    machine_id: z.string().uuid(),
    frequency: z.enum(['weekly', 'monthly']),
    next_due: z.coerce.date(),
    created_by_id: z.string().uuid()
});

export const updateScheduleSchema = z.object({
    title: z.string().min(3).optional(),
    frequency: z.enum(['weekly', 'monthly']).optional(),
    next_due: z.coerce.date().optional()
});
