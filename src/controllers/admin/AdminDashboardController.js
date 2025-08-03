import { WorkOrder } from '../../models/WorkOrder.js';
import { Issue } from '../../models/Issue.js';
import { Machine } from '../../models/Machine.js';
import { Part } from '../../models/Part.js';

export const AdminDashboardController = {
    async overview(req, res) {
        try {
            // Work Orders
            const totalWorkOrders = await WorkOrder.query().resultSize();
            const overdueWorkOrders = await WorkOrder.query()
                .where('status', '!=', 'completed')
                .where('scheduled_date', '<', new Date())
                .resultSize();
            const closedWorkOrders = await WorkOrder.query()
                .where('status', 'completed')
                .resultSize();

            // Work Requests (Issues)
            const totalIssues = await Issue.query().resultSize();
            const openIssues = await Issue.query().where('status', 'open').resultSize();
            const inProgressIssues = await Issue.query().where('status', 'in_progress').resultSize();
            const resolvedIssues = await Issue.query().where('status', 'resolved').resultSize();

            // Machines
            const totalMachines = await Machine.query().resultSize();
            const offlineMachines = await Machine.query().where('status', 'down').resultSize();

            // Parts
            const lowStockParts = await Part.query().whereRaw('quantity_in_stock <= min_stock').resultSize();

            // MTTR, MTBF, Expenses (dummy or simple calculation)
            // Example: MTTR = rata-rata (completed_at - started_at) untuk work order completed
            const mttrResult = await WorkOrder.query()
                .whereNotNull('started_at')
                .whereNotNull('completed_at')
                .where('status', 'completed')
                .select('started_at', 'completed_at');
            let mttr = null;
            if (mttrResult.length > 0) {
                const totalMinutes = mttrResult.reduce((sum, wo) => {
                    const start = new Date(wo.started_at);
                    const end = new Date(wo.completed_at);
                    return sum + ((end - start) / 60000);
                }, 0);
                mttr = (totalMinutes / mttrResult.length / 60).toFixed(1) + 'H';
            }

            // MTBF (dummy)
            const mtbf = '7.9H';

            // Maintenance Expenses (dummy)
            const maintenanceExpenses = 100.76;

            res.json({
                success: true,
                data: {
                    totalWorkOrders,
                    overdueWorkOrders,
                    closedWorkOrders,
                    totalIssues,
                    openIssues,
                    inProgressIssues,
                    resolvedIssues,
                    totalMachines,
                    offlineMachines,
                    lowStockParts,
                    mttr,
                    mtbf,
                    maintenanceExpenses
                }
            });
        } catch (err) {
            console.error("Error in AdminDashboardController.overview:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
};