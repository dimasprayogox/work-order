import { Machine } from '../../models/Machine.js';
import { v4 as uuidv4 } from 'uuid';
import {
    createMachineSchema,
    updateMachineSchema
} from '../../schemas/admin/machineSchema.js';

export const MachineController = {
    // GET /machines (untuk admin, dengan relasi category)
    async index(req, res) {
        try {
            const machines = await Machine.query().withGraphFetched('[category, division]');
            res.json({ success: true, message: 'Fetched machines', data: machines });
        } catch (err) {
            // Error logged in response for debugging
            res.status(500).json({
                success: false,
                message: 'Failed to fetch machines',
                error: err.message,
            });
        }
    },

    // GET /machines/:id (untuk admin)
    async show(req, res) {
        try {
            const machine = await Machine.query()
                .findById(req.params.id)
                .withGraphFetched('[category, division, workOrders, issues, schedules]');

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

    // POST /machines (untuk admin)
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

            const created = await Machine.query().insert({
                id: uuidv4(),
                ...parsed.data,
            });

            const newMachine = await Machine.query().findById(created.id).withGraphFetched('[category, division]');

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

    // PUT /machines/:id (untuk admin)
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

            await Machine.query().patchAndFetchById(req.params.id, {
                ...parsed.data,
                updated_at: new Date(),
            });

            const updated = await Machine.query().findById(req.params.id).withGraphFetched('[category, division]');

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

    // DELETE /machines/:id (untuk admin)
    async destroy(req, res) {
        try {
            const deleted = await Machine.query().deleteById(req.params.id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Machine not found' });
            }

            res.status(200).json({
                success: true,
                message: 'Machine deleted successfully',
                data: { id: req.params.id } // Mengembalikan ID yang dihapus
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete machine',
                error: err.message,
            });
        }
    },

    // DELETE /machines/delete-many
    async destroyMany(req, res) {
        try {
            const { ids } = req.body;

            // Validasi input
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide an array of machine IDs to delete'
                });
            }

            // Eksekusi penghapusan
            const deletedCount = await Machine.query()
                .delete()
                .whereIn('id', ids);

            if (deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No machines found with the provided IDs'
                });
            }

            return res.status(200).json({
                success: true,
                message: `Successfully deleted ${deletedCount} machines`,
                deletedCount
            });

        } catch (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete machines',
                error: err.message,
            });
        }
    },
    
    async getAvailableMachines(req, res) {
        try {

            const machines = await Machine.query().select('id', 'name', 'status');
            res.json({ success: true, message: 'Fetched available machines', data: machines });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch available machines',
                error: err.message,
            });
        }
    }
};