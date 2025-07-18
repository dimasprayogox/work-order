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

            const data = parsed.data;
            const schedule = await Schedule.query().insert({
                id: uuidv4(),
                ...data
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

            const data = parsed.data;
            const updated = await Schedule.query().patchAndFetchById(id, data);
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

    // Dipanggil oleh cron/interval untuk generate WO
    async generateDueWorkOrders(req, res) {
        try {
            const today = new Date().toISOString().split('T')[0];

            const dueSchedules = await Schedule.query()
                .where('next_due', '<=', today)
                .withGraphFetched('machine');

            const createdWOs = [];

            for (const schedule of dueSchedules) {
                const existingWO = await WorkOrder.query()
                    .where('title', schedule.title)
                    .where('machine_id', schedule.machine_id)
                    .where('scheduled_date', schedule.next_due)
                    .first();

                if (existingWO) continue; // skip jika sudah dibuat

                const newWO = await WorkOrder.query().insert({
                    id: uuidv4(),
                    title: schedule.title,
                    description: `Scheduled maintenance: ${schedule.title}`,
                    machine_id: schedule.machine_id,
                    created_by_id: schedule.created_by_id,
                    priority: 'medium',
                    scheduled_date: schedule.next_due,
                    status: 'pending'
                });

                // Hitung next_due selanjutnya
                const nextDate = new Date(schedule.next_due);
                if (schedule.frequency === 'monthly') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (schedule.frequency === 'weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                }

                await Schedule.query().patchAndFetchById(schedule.id, {
                    next_due: nextDate.toISOString().split('T')[0]
                });

                createdWOs.push(newWO);
            }

            res.json({ success: true, message: 'Work Orders generated', data: createdWOs });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};
