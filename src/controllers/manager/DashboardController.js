import { Machine } from '../../models/Machine.js';
import { WorkOrder } from '../../models/WorkOrder.js';

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
                .where('status', '!=', 'resolved')
                .where('scheduled_date', '<', new Date().toISOString().split('T')[0])
                .withGraphFetched('[machine]');

            const totalWO = await WorkOrder.query().resultSize();

            const newWorkRequestsCount = woStatus.find(s => s.status === 'open')?.count || 0;

            const brokenMachines = machineStatus.find(s => s.status === 'broken')?.count || 0;
            const maintenanceMachines = machineStatus.find(s => s.status === 'maintenance')?.count || 0;
            const offlineAssetsCount = brokenMachines + maintenanceMachines;

            res.json({
                success: true,
                data: {
                    machineStatus,
                    workOrderStatus: woStatus,
                    overdueCount: overdueWOs.length,
                    overdueWorkOrders: overdueWOs,
                    totalWorkOrders: totalWO,
                    newWorkRequestsCount,
                    offlineAssetsCount
                }
            });
        } catch (err) {
            console.error("Error in overview:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async workOrderOverdue(req, res) {
        try {
            const overdueWOs = await WorkOrder.query()
                .where('status', '!=', 'resolved')
                .where('scheduled_date', '<', new Date().toISOString().split('T')[0])
                .withGraphFetched('[machine]');

            res.json({ success: true, data: overdueWOs });
        } catch (err) {
            console.error("Error in workOrderOverdue:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async getAllWorkOrders(req, res) {
        try {
            const workOrders = await WorkOrder.query()
                .withGraphFetched('[machine, assignedTo]')
                .orderBy('created_at', 'desc');

            res.json({ success: true, data: workOrders });
        } catch (err) {
            console.error("Error in getAllWorkOrders:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async getMaintenanceSchedule(req, res) {
        try {
            const schedule = await WorkOrder.query()
                .whereNotNull('scheduled_date')
                .where('status', '!=', 'resolved')
                .orderBy('scheduled_date', 'asc')
                .withGraphFetched('machine')
                .select('*');

            const scheduleWithNotes = schedule.map(item => ({
                ...item,
                notes: item.notes || item.description || 'Scheduled maintenance'
            }));

            res.json({ success: true, data: scheduleWithNotes });
        } catch (err) {
            console.error("Error in getMaintenanceSchedule:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },
};