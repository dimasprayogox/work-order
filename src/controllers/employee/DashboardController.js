
import { Machine } from '../../models/Machine.js';
import { WorkOrder } from '../../models/WorkOrder.js';
import { Issue } from '../../models/Issue.js'; 
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
            console.error("Error in DashboardController.overview:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async workOrderOverdue(req, res) {
        try {
            const overdueWOs = await WorkOrder.query()
                .where('status', '!=', 'completed')
                .where('scheduled_date', '<', new Date().toISOString().split('T')[0])
                .withGraphFetched('[machine, technician]');

            res.json({ success: true, data: overdueWOs });
        } catch (err) {
            console.error("Error in DashboardController.workOrderOverdue:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async employeeOverview(req, res) {
        try {
            
            const userId = req.user.userId;
            if (!userId) {
                return res.status(400).json({ success: false, message: "User ID not found in request. Authentication middleware might be missing or faulty." });
            }

            const myReportedIssuesCount = await Issue.query()
                .where('reported_by_id', userId)
                .resultSize();


            res.json({
                success: true,
                data: {
                    myReportedIssuesCount,
                    
                }
            });
        } catch (err) {
            console.error("Error in DashboardController.employeeOverview:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
};