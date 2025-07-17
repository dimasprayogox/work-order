import { Machine } from '../../models/Machine.js';
import { v4 as uuidv4 } from 'uuid';
import {
    createMachineSchema,
    updateMachineSchema
} from '../../schemas/machineSchema.js';

export const MachineController = {
    async index(req, res) {
        try {
            const machines = await Machine.query().withGraphFetched('[category]');
            res.json({ success: true, message: 'Fetched machines', data: machines });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to fetch machines', error: err.message });
        }
    },

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
            res.status(500).json({ success: false, message: 'Failed to fetch machine', error: err.message });
        }
    },

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

            const { name, description, category_id } = parsed.data;

            const newMachine = await Machine.query().insert({
                id: uuidv4(),
                name,
                description,
                category_id,
            });

            res.status(201).json({ success: true, message: 'Machine created', data: newMachine });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to create machine', error: err.message });
        }
    },

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

            const machine = await Machine.query().findById(req.params.id);
            if (!machine) {
                return res.status(404).json({ success: false, message: 'Machine not found' });
            }

            const updateData = parsed.data;
            updateData.updated_at = new Date();

            const updatedMachine = await Machine.query().patchAndFetchById(req.params.id, updateData);

            res.status(200).json({ success: true, message: 'Machine updated', data: updatedMachine });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to update machine', error: err.message });
        }
    },

    async destroy(req, res) {
        try {
            const deleted = await Machine.query().deleteById(req.params.id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Machine not found' });
            }

            res.status(200).json({ success: true, message: 'Machine deleted successfully' });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to delete machine', error: err.message });
        }
    }
};
