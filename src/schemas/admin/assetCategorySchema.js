import { z } from 'zod';

export const createAssetCategorySchema = z.object({
  name: z.string().min(3, 'Asset category name must be at least 3 characters').optional(),
  description: z.string().max(255, 'Maximum description 255 characters').optional(),
});

export const updateAssetCategorySchema = z.object({
  name: z.string().min(3, 'Asset category name must be at least 3 characters').optional(),
  description: z.string().max(255, 'Maximum description 255 characters').optional(),
});
