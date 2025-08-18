import { z } from 'zod';

export const createScheduleSchema = z.object({
    title: z.string().min(3, "Judul jadwal minimal 3 karakter."),
    description: z.string().optional(),
    type: z.enum(['machine', 'asset'], "Type harus machine atau asset."),
    machine_id: z.string().uuid("ID mesin tidak valid.").nullable().optional(),
    asset_id: z.string().uuid("ID asset tidak valid.").nullable().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly'], "Frekuensi tidak valid."),
    next_due_date: z.coerce.date("Tanggal jatuh tempo tidak valid."),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    is_active: z.boolean().default(true),
}).refine((data) => {
    if (data.type === 'machine' && !data.machine_id) {
        return false;
    }
    if (data.type === 'asset' && !data.asset_id) {
        return false;
    }
    return true;
}, {
    message: "Machine ID diperlukan untuk type machine, Asset ID diperlukan untuk type asset",
    path: ["type"]
});

export const updateScheduleSchema = z.object({
    title: z.string().min(3, "Judul jadwal minimal 3 karakter.").optional(),
    description: z.string().optional(),
    type: z.enum(['machine', 'asset'], "Type harus machine atau asset.").optional(),
    machine_id: z.string().uuid("ID mesin tidak valid.").nullable().optional(),
    asset_id: z.string().uuid("ID asset tidak valid.").nullable().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly'], "Frekuensi tidak valid.").optional(),
    next_due_date: z.coerce.date("Tanggal jatuh tempo tidak valid.").optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    is_active: z.boolean().optional(),
}).refine((data) => {
    if (data.type === 'machine' && !data.machine_id) {
        return false;
    }
    if (data.type === 'asset' && !data.asset_id) {
        return false;
    }
    return true;
}, {
    message: "Machine ID diperlukan untuk type machine, Asset ID diperlukan untuk type asset",
    path: ["type"]
});