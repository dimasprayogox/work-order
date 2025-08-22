import { Machine } from '../../models/Machine.js';
import { User } from '../../models/User.js';

export const MachineController = {
    async getAvailableMachines(req, res) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            // Get user with division
            const user = await User.query().findById(req.user.userId).withGraphFetched('division');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Build query to get machines
            let query = Machine.query()
                .withGraphFetched('[category, division]')
                .where('status', 'operational')
                .orderBy('name', 'asc');

            // If user has a division, filter machines by that division and include unassigned machines (division_id IS NULL)
            if (user.division_id) {
                query = query.where(function () {
                    this.where('division_id', user.division_id).orWhereNull('division_id');
                });
            }

            const machines = await query;

            res.status(200).json({
                message: 'Available machines fetched successfully',
                data: machines
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error fetching available machines:', err);
            res.status(500).json({
                message: 'Failed to fetch available machines',
                error: err.message
            });
        }
    }
};
