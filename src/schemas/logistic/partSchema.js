import { z } from "zod";

export const createPartSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  part_number: z
    .string()
    .min(2, "Part number must be at least 2 characters long"),
  description: z.string().optional(),
  quantity_in_stock: z
    .number()
    .int()
    .min(0, "Quantity in stock must be a non-negative integer"),
  min_stock: z
    .number()
    .int()
    .min(0, "Minimum stock must be a non-negative integer"),
  location: z.string().min(3, "Location must be at least 3 characters long"),
  asset_id: z.string().uuid().optional().nullable(),
  machine_id: z.string().uuid().optional().nullable(),
});

export const createPartSchemaWithXor = createPartSchema.refine(
  (data) => {
    const hasAsset = !!data.asset_id;
    const hasMachine = !!data.machine_id;
    return (hasAsset || hasMachine) && !(hasAsset && hasMachine);
  },
  {
    message: "Provide exactly one of asset_id or machine_id",
    path: ["asset_id", "machine_id"],
  }
);

export const updatePartSchema = createPartSchema.partial().refine(
  (data) => {
    // Ensure XOR: exactly one of asset_id or machine_id is provided (non-empty)
    const hasAsset = !!data.asset_id;
    const hasMachine = !!data.machine_id;
    return (hasAsset || hasMachine) && !(hasAsset && hasMachine);
  },
  {
    message: "Provide exactly one of asset_id or machine_id",
    path: ["asset_id", "machine_id"],
  }
);
