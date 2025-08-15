import { z } from 'zod';

export const createDivisionSchema = z.object({
  name: z.string().min(3, 'Division name must be at least 3 characters').optional(),
  description: z.string().max(255, 'Maximum description 255 characters').optional(),
});

export const updateDivisionSchema = z.object({
  name: z.string().min(3, 'Division name must be at least 3 characters').optional(),
  description: z.string().max(255, 'Maximum description 255 characters').optional(),
});
