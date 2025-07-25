import { Machine } from '../../models/Machine.js';
import { WorkOrder } from '../../models/WorkOrder.js';
import { Part } from '../../models/Part.js';
import { User } from '../../models/User.js';
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
                .withGraphFetched('machine');

            res.json({ success: true, data: schedule });
        } catch (err) {
            console.error("Error in getMaintenanceSchedule:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async getPartsAnalysis(req, res) {
        try {
            const mostUsedParts = await WorkOrder.relatedQuery('parts')
                .select('parts.name as partName')
                .sum('work_order_parts.quantity_used as usageCount')
                .join('work_order_parts', 'work_order_parts.part_id', 'parts.id')
                .groupBy('parts.name')
                .orderBy('usageCount', 'desc')
                .limit(5);

            const technicianPartUsage = await User.query()
                .select('users.name as technicianName')
                .sum('work_order_parts.quantity_used as totalPartsUsed')
                .join('work_orders', 'work_orders.assigned_to_user_id', 'users.id')
                .join('work_order_parts', 'work_order_parts.work_order_id', 'work_orders.id')
                .groupBy('users.name')
                .where('users.role', 'technician')
                .orderBy('totalPartsUsed', 'desc')
                .limit(5);

            const criticalStock = await Part.query()
                .where('current_stock', '<=', raw('min_stock_level'))
                .orderBy('current_stock', 'asc');

            const monthlyWoTrend = [];
            const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            const currentYear = new Date().getFullYear();
            for (let i = 0; i < 6; i++) {
                const monthIndex = (new Date().getMonth() - i + 12) % 12;
                const monthName = months[monthIndex];
                const startOfMonth = new Date(currentYear, monthIndex, 1);
                const endOfMonth = new Date(currentYear, monthIndex + 1, 0);

                const issuesCount = await WorkOrder.query()
                    .whereBetween('created_at', [startOfMonth.toISOString(), endOfMonth.toISOString()])
                    .resultSize();

                const resolvedCount = await WorkOrder.query()
                    .whereBetween('completed_at', [startOfMonth.toISOString(), endOfMonth.toISOString()])
                    .where('status', 'resolved')
                    .resultSize();

                monthlyWoTrend.unshift({
                    name: monthName,
                    issues: issuesCount,
                    resolved: resolvedCount
                });
            }

            res.json({
                success: true,
                data: {
                    mostUsedParts,
                    technicianPartUsage,
                    criticalStock,
                    monthlyWoTrend: {
                        labels: monthlyWoTrend.map(m => m.name),
                        datasets: [
                            {
                                label: 'Total Work Orders',
                                data: monthlyWoTrend.map(m => m.issues),
                                borderColor: 'var(--blue-500)',
                                backgroundColor: 'rgba(59, 130, 246, 0.2)'
                            },
                            {
                                label: 'Work Orders Completed',
                                data: monthlyWoTrend.map(m => m.resolved),
                                borderColor: 'var(--green-500)',
                                backgroundColor: 'rgba(16, 185, 129, 0.2)'
                            }
                        ]
                    }
                }
            });

        } catch (err) {
            console.error("Error in getPartsAnalysis:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async getKpiMetrics(req, res) {
        try {
            const onTimeRate = 85;
            const mttr = "4.2H";
            const mtbf = "150H";
            const expenses = 5750.25;
            const plannedPercentage = 70;
            const lowStock = 25;
            const pendingPO = 2;
            const inventoryValue = 80000.00;

            res.json({
                success: true,
                data: {
                    onTimeRate,
                    mttr,
                    mtbf,
                    expenses,
                    plannedPercentage,
                    lowStock,
                    pendingPO,
                    inventoryValue
                }
            });
        } catch (err) {
            console.error("Error in getKpiMetrics:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
};