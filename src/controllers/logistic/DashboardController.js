import { Part } from "../../models/Part.js";
import { PartRequest } from "../../models/PartRequest.js";
import { PartUsage } from "../../models/PartUsage.js";

export const LogisticsDashboardController = {
  async index(req, res) {
    try {
      const [
        totalParts,
        allParts, // Get all parts untuk menghitung low stock dan out of stock
        pendingRequests,
        approvedRequests,
        fulfilledRequests,
        rejectedRequest,
        topUsedParts,
        criticalParts,
      ] = await Promise.all([
        // Total parts
        Part.query().resultSize(),

        // Get all parts untuk diolah manual
        Part.query(),

        // Pending requests
        PartRequest.query().where("status", "pending").resultSize(),

        // Approved requests
        PartRequest.query().where("status", "approved").resultSize(),

        // Fulfilled requests
        PartRequest.query().where("status", "fulfilled").resultSize(),

        // Rejected requests
        PartRequest.query().where("status", "rejected").resultSize(),

        // Top used parts
        PartUsage.query()
          .select("part_id")
          .sum("quantity_used as total_used")
          .groupBy("part_id")
          .orderBy("total_used", "desc")
          .limit(5)
          .withGraphFetched("part"),

        // Critical parts: out of stock parts yang sering digunakan
        PartUsage.query()
          .select("part_id")
          .sum("quantity_used as total_used")
          .groupBy("part_id")
          .withGraphFetched("part")
          .then((partsUsage) => {
            const partIds = partsUsage.map((pu) => pu.part_id);
            if (partIds.length === 0) return [];

            return Part.query()
              .whereIn("id", partIds)
              .where((builder) => {
                builder.whereRaw("quantity_in_stock <= min_stock");
              })
              .then((outOfStockParts) => {
                return partsUsage
                  .filter((pu) =>
                    outOfStockParts.some((p) => p.id === pu.part_id)
                  )
                  .sort((a, b) => b.total_used - a.total_used)
                  .slice(0, 5);
              });
          }),
      ]);

      // Hitung low stock dan out of stock secara manual
      const lowStockParts = allParts.filter(
        (part) =>
          part.quantity_in_stock > part.min_stock &&
          part.quantity_in_stock <= part.min_stock + 2
      );

      const outOfStockParts = allParts.filter(
        (part) => part.quantity_in_stock <= part.min_stock
      );

      res.json({
        success: true,
        message: "Logistics dashboard data",
        data: {
          part_summary: {
            total_parts: totalParts,
            low_stock: lowStockParts.length,
            low_stock_parts: lowStockParts,
            out_of_stock: outOfStockParts.length,
            out_of_stock_parts: outOfStockParts,
            critical_parts: criticalParts.length,
            critical_parts_details: criticalParts,
          },
          part_requests: {
            pending: pendingRequests,
            approved: approvedRequests,
            fulfilled: fulfilledRequests,
            rejected: rejectedRequest,
          },
          top_used_parts: topUsedParts,
        },
      });
    } catch (err) {
      console.error("Error in LogisticsDashboardController.index:", err);
      res.status(500).json({
        success: false,
        message: "Failed to load dashboard data",
        error: err.message,
      });
    }
  },
};
