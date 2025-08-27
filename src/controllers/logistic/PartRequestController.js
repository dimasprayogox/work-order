import { PartRequest } from "../../models/PartRequest.js";
import { PartRequestItem } from "../../models/PartRequestItem.js";
import { updatePartRequestStatusSchema } from "../../schemas/logistic/partRequestSchema.js";
import { Part } from "../../models/Part.js";
import { PartUsage } from "../../models/PartUsage.js"; 
import { db } from "../../core/config/knex.js"; 
import { v4 as uuidv4 } from "uuid"; 

export const PartRequestController = {
  // GET /api/logistics/part-requests
  async index(req, res) {
    try {
      const requests = await PartRequest.query().withGraphFetched(
        "[items.part, requestedBy]"
      );
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error("Error fetching part requests:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // PATCH /api/logistics/part-requests/:id/status
  async updateStatus(req, res) {
    const { id } = req.params;

    const parsed = updatePartRequestStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const request = await PartRequest.query().findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Part request not found",
      });
    }

    try {
      // Memulai transaksi
      await db.transaction(async (trx) => {
        // Update quantity_approved untuk setiap item
        if (parsed.data.items && parsed.data.items.length > 0) {
          await Promise.all(
            parsed.data.items.map((item) =>
              // BENAR: Menggunakan trx
              PartRequestItem.query(trx)
                .findById(item.item_id)
                .patch({ quantity_approved: item.approved_quantity })
            )
          );
        }

        // Jika status "fulfilled", kurangi stok dan catat penggunaan
        if (parsed.data.status === "fulfilled") {
          // BENAR: Menggunakan trx
          const items = await PartRequestItem.query(trx).where(
            "part_request_id",
            id
          );

          for (const item of items) {
            if (item.quantity_approved !== null && item.quantity_approved > 0) {
              // BENAR: Menggunakan trx
              await Part.query(trx)
                .findById(item.part_id)
                .decrement("quantity_in_stock", item.quantity_approved);

              // BENAR: Menggunakan trx
              await PartUsage.query(trx).insert({
                id: uuidv4(),
                part_id: item.part_id,
                work_order_id: request.work_order_id,
                used_by_id: request.requested_by_id,
                quantity_used: item.quantity_approved,
                part_request_item_id: item.id,
              });
            }
          }
        }

        // BENAR: Menggunakan trx untuk update status akhir
        await PartRequest.query(trx)
          .patch({
            status: parsed.data.status,
            note: parsed.data.note,
          })
          .where({ id });
      });

      // Setelah transaksi berhasil, ambil data terbaru
      const updatedRequest = await PartRequest.query()
        .withGraphFetched("[items.part, requestedBy]")
        .findById(id);

      return res.json({
        success: true,
        message: "Part request updated successfully",
        data: updatedRequest,
      });
    } catch (error) {
      console.error("Error updating part request:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};