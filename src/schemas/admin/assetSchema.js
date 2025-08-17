import { z } from 'zod';

export const createAssetSchema = z.object({
  asset_code: z.string().min(1).optional(),
  name: z.string().min(3, 'Asset name must be at least 3 characters').optional(),
  location: z.string().max(100).optional(),
  status: z.enum(['operational', 'maintenance', 'down', 'inactive']).optional(),
  category_id: z.string().max(36).optional(),
  division_id: z.string().max(36).optional(),
  type: z.string().max(50).optional(),
});

export const updateAssetSchema = z.object({
  asset_code: z.string().min(1).optional(),
  name: z.string().min(3, 'Asset name must be at least 3 characters').optional(),
  location: z.string().max(100).optional(),
  status: z.enum(['operational', 'maintenance', 'down', 'inactive']).optional(),
  category_id: z.string().max(36).optional(),
  division_id: z.string().max(36).optional(),
  type: z.string().max(50).optional(),
});
