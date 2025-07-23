import { WorkOrder } from '../../models/WorkOrder.js';
import { Issue } from '../../models/Issue.js';
import { v4 as uuidv4 } from 'uuid';
import { createWorkOrderSchema, updateWorkOrderSchema } from '../../schemas/manager/workOrderSchema.js';

export const WorkOrderController = {
    async index(req, res) {
        try {
            const workOrders = await WorkOrder.query()
                .withGraphFetched('[machine, assignedTo, createdBy]')
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
                .withGraphFetched('[machine, assignedTo, createdBy]');

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

            // Jika issue_id dikirim, update tabel issues
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

            // 1. Cek kalau assigned_to_id sudah ada, tidak bisa diganti
            if (existingWO.assigned_to_id && data.assigned_to_id && data.assigned_to_id !== existingWO.assigned_to_id) {
                return res.status(400).json({ success: false, message: "Assigned technician cannot be changed once set." });
            }

            // 2. Kalau status = rejected, pastikan status sebelumnya pending dan notes diisi
            if (data.status === 'rejected') {
                if (existingWO.status !== 'pending') {
                    return res.status(400).json({ success: false, message: "Only pending work orders can be rejected." });
                }
                if (!data.notes || data.notes.trim() === '') {
                    return res.status(400).json({ success: false, message: "Notes are required when rejecting a work order." });
                }
            }

            // 3. Tidak boleh mengganti scheduled_date kurang dari 3 hari dari tanggal sebelumnya
            if (data.scheduled_date && existingWO.scheduled_date) {
                const oldDate = new Date(existingWO.scheduled_date);
                const newDate = new Date(data.scheduled_date);

                const diffDays = (newDate - oldDate) / (1000 * 60 * 60 * 24);
                if (diffDays < 3) {
                    return res.status(400).json({
                        success: false,
                        message: "Scheduled date must be at least 3 days later than the current scheduled date."
                    });
                }
            }

            const updatedWO = await WorkOrder.query().patchAndFetchById(id, data);

            res.json({ success: true, data: updatedWO });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            // Ambil Work Order dulu
            const existingWO = await WorkOrder.query().findById(id);
            if (!existingWO) {
                return res.status(404).json({ success: false, message: "Work Order not found." });
            }

            // Hanya bisa hapus kalau status = pending
            if (existingWO.status !== "pending") {
                return res.status(400).json({ success: false, message: "Only pending Work Orders can be deleted." });
            }

            await WorkOrder.query().deleteById(id);

            res.json({ success: true, message: "Work Order deleted successfully." });
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
