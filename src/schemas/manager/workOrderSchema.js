import { z } from 'zod';

export const createWorkOrderSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    machine_id: z.string().uuid(),
    assigned_to_id: z.string().uuid().optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    scheduled_date: z.coerce.date().optional(),
    issue_id: z.string().uuid().optional()
});

export const updateWorkOrderSchema = z.object({
    title: z.string().min(3).optional(),
    assigned_to_id: z.string().uuid().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    status: z.enum([
        'pending',
        'assigned',      
        'in_progress',
        'completed',
        'rejected',
        'cancelled'      
    ]).optional(),
    scheduled_date: z.coerce.date().optional(),
    notes: z.string().optional()
});
