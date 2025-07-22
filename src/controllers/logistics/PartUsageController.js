import { Part } from "../../models/Part.js";
import { PartUsage } from "../../models/PartUsage.js";

export const PartUsageController = {
    async topUsedParts(req, res) {
        const topParts = await PartUsage.query()
            .select('part_id')
            .sum('quantity_used as total_used')
            .groupBy('part_id')
            .orderBy('total_used', 'desc')
            .limit(10)
            .withGraphFetched('part');

        res.json({ success: true, data: topParts });
    },

    async usageLog(req, res) {
        const log = await PartUsage.query()
            .withGraphFetched('[workOrder, part]')
            .orderBy('created_at', 'desc');

        res.json({ success: true, data: log });
    }
};
