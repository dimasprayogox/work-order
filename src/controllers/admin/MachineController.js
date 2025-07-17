import { Machine } from '../../models/Machine.js';
import { v4 as uuidv4 } from 'uuid';
import {
    createMachineSchema,
    updateMachineSchema
} from '../../schemas/admin/machineSchema.js';

export const MachineController = {
    // GET /machines
    async index(req, res) {
        try {
            const machines = await Machine.query().withGraphFetched('[category]');
            res.json({ success: true, message: 'Fetched machines', data: machines });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch machines',
                error: err.message,
            });
        }
    },

    // GET /machines/:id
    async show(req, res) {
        try {
            const machine = await Machine.query()
                .findById(req.params.id)
                .withGraphFetched('[category, workOrders, issues, schedules]');

            if (!machine) {
                return res.status(404).json({ success: false, message: 'Machine not found' });
            }

            res.status(200).json({ success: true, data: machine });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch machine',
                error: err.message,
            });
        }
    },

    // POST /machines
    async store(req, res) {
        try {
            const parsed = createMachineSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const newMachine = await Machine.query().insert({
                id: uuidv4(),
                ...parsed.data,
            });

            res.status(201).json({
                success: true,
                message: 'Machine created',
                data: newMachine,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to create machine',
                error: err.message,
            });
        }
    },

    // PUT /machines/:id
    async update(req, res) {
        try {
            const parsed = updateMachineSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const updated = await Machine.query().patchAndFetchById(req.params.id, {
                ...parsed.data,
                updated_at: new Date(),
            });

            if (!updated) {
                return res.status(404).json({ success: false, message: 'Machine not found' });
            }

            res.status(200).json({
                success: true,
                message: 'Machine updated',
                data: updated,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to update machine',
                error: err.message,
            });
        }
    },

    // DELETE /machines/:id
    async destroy(req, res) {
        try {
            const deleted = await Machine.query().deleteById(req.params.id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Machine not found' });
            }

            res.status(200).json({
                success: true,
                message: 'Machine deleted successfully',
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete machine',
                error: err.message,
            });
        }
    },
};
