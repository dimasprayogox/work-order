import { MaintenanceSchedule as Schedule } from '../../models/MaintenanceSchedule.js';
import { WorkOrder } from '../../models/WorkOrder.js';
import { User } from '../../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { createScheduleSchema, updateScheduleSchema } from '../../schemas/admin/scheduleSchema.js';

const pad = (n) => n.toString().padStart(2, '0');
const formatDateTime = (date) => {
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

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
            const parsed = createScheduleSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const data = parsed.data;

            if (!req.user || !req.user.userId) {
                return res.status(401).json({ success: false, message: "Unauthorized: User ID not available." });
            }

            const creatingUser = await User.query().findById(req.user.userId);
            if (!creatingUser) {
                return res.status(400).json({ success: false, message: `User with ID ${req.user.userId} not found.` });
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
            res.status(500).json({ success: false, message: "Internal server error while creating schedule." });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const parsed = updateScheduleSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const updated = await Schedule.query().patchAndFetchById(id, parsed.data);

            res.json({ success: true, data: updated });
        } catch (err) {
            console.error("Error updating schedule:", err);
            res.status(500).json({ success: false, message: "Internal server error while updating schedule." });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            await Schedule.query().deleteById(id);
            res.json({ success: true, message: 'Schedule deleted' });
        } catch (err) {
            console.error("Error deleting schedule:", err);
            res.status(500).json({ success: false, message: "Internal server error while deleting schedule." });
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
                    next_due_date: formatDateTime(nextDate)
                });

                createdWOs.push(newWO);
            }

            res.json({ success: true, message: 'Work Orders generated', data: createdWOs });
        } catch (err) {
            console.error("Error generating due work orders:", err);
            res.status(500).json({ success: false, message: "Internal server error while generating due work orders." });
        }
    }
};