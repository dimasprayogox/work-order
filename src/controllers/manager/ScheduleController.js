import { MaintenanceSchedule as Schedule } from '../../models/MaintenanceSchedule.js';
import { WorkOrder } from '../../models/WorkOrder.js';
import { User } from '../../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { createScheduleSchema, updateScheduleSchema } from '../../schemas/manager/scheduleSchema.js';

export const ScheduleController = {
    async index(req, res) {
        try {
            const schedules = await Schedule.query()
                .withGraphFetched('[machine, createdBy]')
                .orderBy('created_at', 'desc');

            res.json({ success: true, data: schedules });
        } catch (err) {
            console.error("Error fetching schedules:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async show(req, res) {
        try {
            const { id } = req.params;
            const schedule = await Schedule.query()
                .findById(id)
                .withGraphFetched('[machine, createdBy]');

            if (!schedule) {
                return res.status(404).json({ success: false, message: 'Schedule not found' });
            }

            res.json({ success: true, data: schedule });
        } catch (err) {
            console.error("Error fetching single schedule:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async create(req, res) {
        try {
            console.log("Incoming request body for schedule creation:", req.body);

            const parsed = createScheduleSchema.safeParse(req.body);
            if (!parsed.success) {
                console.error("Zod Validation Error in create schedule:", JSON.stringify(parsed.error.flatten(), null, 2));
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const data = parsed.data;
            console.log("Parsed data for schedule creation (after Zod):", data);

            console.log("req.user object:", req.user);
            if (!req.user || !req.user.userId) {
                console.error("Authentication Error: User ID not found in request. req.user:", req.user);
                return res.status(401).json({ success: false, message: "Unauthorized: User ID not available." });
            }

            const creatingUser = await User.query().findById(req.user.userId);
            if (!creatingUser) {
                console.error(`Foreign Key Violation: User with ID ${req.user.userId} not found in database.`);
                return res.status(400).json({ success: false, message: `Pengguna dengan ID ${req.user.userId} tidak ditemukan. Pastikan data pengguna ada di database.` });
            }

            const schedule = await Schedule.query().insert({
                id: uuidv4(),
                created_by_id: req.user.userId,
                next_due_date: data.next_due_date,
                title: data.title,
                description: data.description,
                machine_id: data.machine_id,
                frequency: data.frequency,
                priority: data.priority
            });

            res.status(201).json({ success: true, data: schedule });
        } catch (err) {
            console.error("Error creating schedule:", err);
            if (err.stack) {
                console.error("Error stack trace:", err.stack);
            }
            res.status(500).json({ success: false, message: "Terjadi kesalahan server internal saat membuat jadwal." });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const parsed = updateScheduleSchema.safeParse(req.body);
            if (!parsed.success) {
                console.error("Zod Validation Error in update schedule:", JSON.stringify(parsed.error.flatten(), null, 2));
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const { next_due_date, ...rest } = parsed.data;

            const updated = await Schedule.query().patchAndFetchById(id, {
                next_due_date,
                ...rest
            });

            res.json({ success: true, data: updated });
        } catch (err) {
            console.error("Error updating schedule:", err);
            res.status(500).json({ success: false, message: "Terjadi kesalahan server internal saat memperbarui jadwal." });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            await Schedule.query().deleteById(id);
            res.json({ success: true, message: 'Schedule deleted' });
        } catch (err) {
            console.error("Error deleting schedule:", err);
            res.status(500).json({ success: false, message: "Terjadi kesalahan server internal saat menghapus jadwal." });
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

                const nextDate = new Date(schedule.next_due_date);
                if (schedule.frequency === 'monthly') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (schedule.frequency === 'weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else if (schedule.frequency === 'daily') {
                    nextDate.setDate(nextDate.getDate() + 1);
                } else if (schedule.frequency === 'yearly') {
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                }

                await Schedule.query().patchAndFetchById(schedule.id, {
                    next_due_date: nextDate.toISOString()
                });

                createdWOs.push(newWO);
            }

            res.json({ success: true, message: 'Work Orders generated', data: createdWOs });
        } catch (err) {
            console.error("Error generating due work orders:", err);
            res.status(500).json({ success: false, message: "Terjadi kesalahan server internal saat membuat work order jatuh tempo." });
        }
    }
};
