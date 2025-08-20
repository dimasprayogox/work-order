import { z } from "zod";

export const createMachineSchema = z.object({
    machine_code: z.string().min(3, "Kode mesin minimal 3 karakter"),
    name: z.string().min(3, "Nama mesin minimal 3 karakter"),
    location: z.string().min(3, "Lokasi minimal 3 karakter"),
    status: z.enum(["operational", "maintenance", "down"]),
    category_id: z.union([
        z.string().uuid(),
        z.literal(''),
        z.null(),
        z.undefined()
    ]).optional().nullable().transform(val => {
        if (val === '' || val === null || val === undefined) return null;
        return val;
    }),
    division_id: z.union([
        z.string().uuid(),
        z.literal(''),
        z.null(),
        z.undefined()
    ]).optional().nullable().transform(val => {
        if (val === '' || val === null || val === undefined) return null;
        return val;
    }),
});

export const updateMachineSchema = z.object({
    machine_code: z.string().min(3).optional(),
    name: z.string().min(3).optional(),
    location: z.string().min(3).optional(),
    status: z.enum(["operational", "maintenance", "down"]).optional(),
    category_id: z.union([
        z.string().uuid(),
        z.literal(''),
        z.null(),
        z.undefined()
    ]).optional().nullable().transform(val => {
        if (val === '' || val === null || val === undefined) return null;
        return val;
    }),
    division_id: z.union([
        z.string().uuid(),
        z.literal(''),
        z.null(),
        z.undefined()
    ]).optional().nullable().transform(val => {
        if (val === '' || val === null || val === undefined) return null;
        return val;
    }),
});
