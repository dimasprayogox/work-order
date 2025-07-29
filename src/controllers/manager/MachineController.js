import { Machine } from '../../models/Machine.js';

export const MachineController = {
    async index(req, res) {
        try {
            const machines = await Machine.query().withGraphFetched('category').orderBy('name', 'asc');
            res.json({ success: true, data: machines });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
};
