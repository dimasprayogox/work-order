import { Part } from "../../models/Part.js";
import { PartRequest } from "../../models/PartRequest.js";
import { PartUsage } from "../../models/PartUsage.js";

export const LogisticsDashboardController = {
    async index(req, res) {
        try {
            const [
                totalParts,
                lowStockParts,
                pendingRequests,
                approvedRequests,
                fulfilledRequests,
                topUsedParts
            ] = await Promise.all([
                Part.query().resultSize(),

                Part.query()
                    .whereRaw('quantity_in_stock < min_stock'),

                PartRequest.query()
                    .where('status', 'pending')
                    .resultSize(),

                PartRequest.query()
                    .where('status', 'approved')
                    .resultSize(),

                PartRequest.query()
                    .where('status', 'fulfilled')
                    .resultSize(),

                PartUsage.query()
                    .select('part_id')
                    .sum('quantity_used as total_used')
                    .groupBy('part_id')
                    .orderBy('total_used', 'desc')
                    .limit(5)
                    .withGraphFetched('part') // Mengambil relasi part
            ]);

            res.json({
                success: true,
                message: "Logistics dashboard data",
                data: {
                    part_summary: {
                        total_parts: totalParts,
                        low_stock: lowStockParts.length,
                        low_stock_parts: lowStockParts
                    },
                    part_requests: {
                        pending: pendingRequests,
                        approved: approvedRequests,
                        fulfilled: fulfilledRequests
                    },
                    top_used_parts: topUsedParts
                }
            });
        } catch (err) {
            console.error("Error in LogisticsDashboardController.index:", err);
            res.status(500).json({
                success: false,
                message: "Failed to load dashboard data",
                error: err.message
            });
        }
    }
};
