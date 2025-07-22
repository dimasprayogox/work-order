import { Machine } from '../../models/Machine.js';
import { WorkOrder } from '../../models/WorkOrder.js';
import { raw } from 'objection';

export const DashboardController = {
    async overview(req, res) {
        try {
            const machineStatus = await Machine.query()
                .select('status')
                .count('id as count')
                .groupBy('status');

            const woStatus = await WorkOrder.query()
                .select('status')
                .count('id as count')
                .groupBy('status');

            const overdueWOs = await WorkOrder.query()
                .where('status', '!=', 'completed')
                .where('scheduled_date', '<', new Date().toISOString().split('T')[0]);

            const totalWO = await WorkOrder.query().resultSize();

            res.json({
                success: true,
                data: {
                    machineStatus,
                    workOrderStatus: woStatus,
                    overdueCount: overdueWOs.length,
                    overdueWorkOrders: overdueWOs,
                    totalWorkOrders: totalWO
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async workOrderOverdue(req, res) {
        try {
            const overdueWOs = await WorkOrder.query()
                .where('status', '!=', 'completed')
                .where('scheduled_date', '<', new Date().toISOString().split('T')[0])
                .withGraphFetched('[machine]');

            res.json({ success: true, data: overdueWOs });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};
