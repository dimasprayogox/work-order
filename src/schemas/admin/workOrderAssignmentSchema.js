import { z } from 'zod';

export const assignWorkOrderSchema = z.object({
    work_order_id: z.string().uuid(),
    assigned_to_id: z.string().uuid(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    scheduled_date: z.coerce.date().optional(),
    notes: z.string().optional()
});

export const bulkAssignWorkOrderSchema = z.object({
    assignments: z.array(z.object({
        work_order_id: z.string().uuid(),
        assigned_to_id: z.string().uuid(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        scheduled_date: z.coerce.date().optional()
    })).min(1).max(50)
});

export const reassignWorkOrderSchema = z.object({
    new_assigned_to_id: z.string().uuid(),
    reason: z.string().min(5).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional()
});