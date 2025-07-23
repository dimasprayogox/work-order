import { PartRequest } from "../../models/PartRequest.js";
import { PartRequestItem } from "../../models/PartRequestItem.js";
import { updatePartRequestStatusSchema } from "../../schemas/logistic/partRequestSchema.js";
import { Part } from "../../models/Part.js";

export const PartRequestController = {
  // GET /api/logistics/part-requests
  async index(req, res) {
    try {
      const requests = await PartRequest.query().withGraphFetched('[items.part, requestedBy]');
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error("Error fetching part requests:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  // PATCH /api/logistics/part-requests/:id/status
  async updateStatus(req, res) {
    const { id } = req.params;

    // Validasi input dari request body
    const parsed = updatePartRequestStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors
      });
    }

    // Cek apakah request dengan ID tersebut ada
    const request = await PartRequest.query().findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Part request not found"
      });
    }

    // ✅ Update quantity_approved untuk setiap item
    if (parsed.data.items && parsed.data.items.length > 0) {
      await Promise.all(
        parsed.data.items.map(item =>
          PartRequestItem.query()
            .findById(item.item_id)
            .patch({ quantity_approved: item.approved_quantity })
        )
      );
    }

    // ✅ Kurangi stok part jika status fulfilled
    if (parsed.data.status === "fulfilled") {
      const items = await PartRequestItem.query().where('part_request_id', id);

      for (const item of items) {
        if (item.quantity_approved !== null && item.quantity_approved > 0) {
          await Part.query()
            .findById(item.part_id)
            .decrement('quantity_in_stock', item.quantity_approved);
        }
      }
    }

    // ✅ Update status dan note part request
    const updatedRequest = await PartRequest.query().patchAndFetchById(id, {
      status: parsed.data.status,
      note: parsed.data.note,
      updated_at: new Date()
    });

    return res.json({
      success: true,
      message: "Part request updated successfully",
      data: updatedRequest
    });
  }
};
