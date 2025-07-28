import { MaintenanceSchedule as Schedule } from '../../models/MaintenanceSchedule.js';
import { WorkOrder } from '../../models/WorkOrder.js';
import { v4 as uuidv4 } from 'uuid';
import { createScheduleSchema, updateScheduleSchema } from '../../schemas/manager/scheduleSchema.js';

export const ScheduleController = {
    async index(req, res) {
        try {
            const schedules = await Schedule.query().withGraphFetched('machine');
            res.json({ success: true, data: schedules });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async create(req, res) {
        try {
            const parsed = createScheduleSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            // Pastikan format waktu tidak diubah (ambil langsung dari frontend)
            const { next_due_date, ...rest } = parsed.data;

            const schedule = await Schedule.query().insert({
                id: uuidv4(),
                created_by_id: req.user.userId,
                next_due_date, // disimpan sesuai input frontend
                ...rest
            });

            res.status(201).json({ success: true, data: schedule });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const parsed = updateScheduleSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const { next_due_date, ...rest } = parsed.data;

            const updated = await Schedule.query().patchAndFetchById(id, {
                next_due_date,
                ...rest
            });

            res.json({ success: true, data: updated });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            await Schedule.query().deleteById(id);
            res.json({ success: true, message: 'Schedule deleted' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async generateDueWorkOrders(req, res) {
        try {
            const now = new Date().toISOString();

            const dueSchedules = await Schedule.query()
                .where('next_due_date', '<=', now)
                .withGraphFetched('machine');

            const createdWOs = [];

            for (const schedule of dueSchedules) {
                const existingWO = await WorkOrder.query()
                    .where('title', schedule.title)
                    .where('machine_id', schedule.machine_id)
                    .where('scheduled_date', schedule.next_due_date)
                    .first();

                if (existingWO) continue;

                const newWO = await WorkOrder.query().insert({
                    id: uuidv4(),
                    title: schedule.title,
                    description: `Scheduled maintenance: ${schedule.title}`,
                    machine_id: schedule.machine_id,
                    created_by_id: schedule.created_by_id,
                    priority: 'medium',
                    scheduled_date: schedule.next_due_date,
                    status: 'pending'
                });

                // Hitung jadwal berikutnya
                const nextDate = new Date(schedule.next_due_date);
                if (schedule.frequency === 'monthly') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (schedule.frequency === 'weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                }

                await Schedule.query().patchAndFetchById(schedule.id, {
                    next_due_date: nextDate.toISOString().slice(0, 19).replace('T', ' ')
                });

                createdWOs.push(newWO);
            }

            res.json({ success: true, message: 'Work Orders generated', data: createdWOs });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};
