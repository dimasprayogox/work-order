import { WorkOrder } from '../../models/WorkOrder.js';
import { Issue } from '../../models/Issue.js';
import { v4 as uuidv4 } from 'uuid';
import { createWorkOrderSchema, updateWorkOrderSchema } from '../../schemas/manager/workOrderSchema.js';

export const WorkOrderController = {
    async index(req, res) {
        try {
            const workOrders = await WorkOrder.query()
                .withGraphFetched('[machine, assignedTo, createdBy, issue]')
                .orderBy('created_at', 'desc');

            res.json({ success: true, data: workOrders });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async show(req, res) {
        try {
            const { id } = req.params;
            const workOrder = await WorkOrder.query()
                .findById(id)
                .withGraphFetched('[machine, assignedTo, createdBy, issue]');

            if (!workOrder) {
                return res.status(404).json({ success: false, message: 'Work Order not found' });
            }

            res.json({ success: true, data: workOrder });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async create(req, res) {
        try {
            const parsed = createWorkOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const data = parsed.data;
            const newWOId = uuidv4();

            const newWO = await WorkOrder.query().insert({
                id: newWOId,
                ...data,
                status: 'pending',
                created_by_id: req.user.userId,
            });

            if (data.issue_id) {
                await Issue.query()
                    .patch({ work_order_id: newWOId })
                    .where('id', data.issue_id);
            }

            res.status(201).json({ success: true, data: newWO });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const parsed = updateWorkOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const data = parsed.data;
            const existingWO = await WorkOrder.query().findById(id);

            if (!existingWO) {
                return res.status(404).json({ success: false, message: "Work Order not found" });
            }

            // Logika perubahan status:
            // Jika assigned_to_id ditambahkan DAN status saat ini pending, ubah ke in_progress
            if (data.assigned_to_id && existingWO.status === 'pending') {
                data.status = 'in_progress';
            } 
            // Jika status yang diminta adalah 'completed' DAN status saat ini 'in_progress', set completed_at
            else if (data.status === 'completed' && existingWO.status === 'in_progress') {
                data.completed_at = new Date(); // Set waktu selesai
            } else if (data.status && !['pending', 'in_progress', 'completed'].includes(data.status)) {
                // Menolak update status ke nilai yang tidak diizinkan jika status berasal dari frontend
                return res.status(400).json({ success: false, message: "Status tidak valid." });
            }

            if (data.scheduled_date) {
                const newDate = new Date(data.scheduled_date);
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                if (newDate < now) {
                    return res.status(400).json({
                        success: false,
                        message: "Tanggal penjadwalan tidak boleh di masa lalu."
                    });
                }
            }

            await WorkOrder.query().patchAndFetchById(id, data);

            const updatedWOWithRelations = await WorkOrder.query()
                .findById(id)
                .withGraphFetched('[machine, assignedTo, createdBy, issue]');

            res.json({ success: true, data: updatedWOWithRelations });
        } catch (err) {
            console.error("Error updating work order:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const existingWO = await WorkOrder.query().findById(id);
            if (!existingWO) {
                return res.status(404).json({ success: false, message: "Work Order tidak ditemukan." });
            }

            if (existingWO.status !== "pending") {
                return res.status(400).json({ success: false, message: "Hanya Work Order 'pending' yang dapat dihapus." });
            }

            await WorkOrder.query().deleteById(id);
            res.json({ success: true, message: "Work Order berhasil dihapus." });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async overdue(req, res) {
        try {
            const now = new Date().toISOString();
            const overdue = await WorkOrder.query()
                .where('scheduled_date', '<', now)
                .whereNot('status', 'completed')
                .withGraphFetched('[machine, assignedTo]');

            res.json({ success: true, data: overdue });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};