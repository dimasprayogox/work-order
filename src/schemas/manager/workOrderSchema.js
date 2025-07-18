import { z } from 'zod';

export const createWorkOrderSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    machine_id: z.string().uuid(),
    assigned_to_id: z.string().uuid().optional(),
    created_by_id: z.string().uuid(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    scheduled_date: z.coerce.date().optional(),
    issue_id: z.string().uuid().optional()
});


export const updateWorkOrderSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    assigned_to_id: z.string().uuid().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
    scheduled_date: z.coerce.date().optional(),
    started_at: z.coerce.date().optional(),
    completed_at: z.coerce.date().optional(),
    notes: z.string().optional()
});
