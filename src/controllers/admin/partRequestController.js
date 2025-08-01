// src/controllers/admin/partRequestController.js
import { PartRequest } from "../../models/PartRequest.js";
import { PartRequestItem } from "../../models/PartRequestItem.js";
import { updatePartRequestStatusSchema } from "../../schemas/logistic/partRequestSchema.js";
import { Part } from "../../models/Part.js";

export const AdminPartRequestController = {
    // GET /api/admin/part-requests
    async index(req, res) {
        try {
            const requests = await PartRequest.query().withGraphFetched(
                "[items.part, requestedBy, workOrder]"
            );
            res.json({ success: true, data: requests });
        } catch (error) {
            console.error("Error fetching part requests:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch part requests",
            });
        }
    },

    // PATCH /api/admin/part-requests/:id/status
    async updateStatus(req, res) {
        try {
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

            // Update quantity_approved untuk setiap item
            if (parsed.data.items && parsed.data.items.length > 0) {
                await Promise.all(
                    parsed.data.items.map((item) =>
                        PartRequestItem.query()
                            .findById(item.item_id)
                            .patch({ quantity_approved: item.approved_quantity })
                    )
                );
            }

            // Jika fulfilled, kurangi stok part
            if (parsed.data.status === "fulfilled") {
                const items = await PartRequestItem.query().where(
                    "part_request_id",
                    id
                );

                for (const item of items) {
                    if (item.quantity_approved && item.quantity_approved > 0) {
                        await Part.query()
                            .findById(item.part_id)
                            .decrement("quantity_in_stock", item.quantity_approved);
                    }
                }
            }

            const updatedRequest = await PartRequest.query().patchAndFetchById(id, {
                status: parsed.data.status,
                note: parsed.data.note,
                updated_at: new Date(),
            });

            res.json({
                success: true,
                message: "Part request updated successfully",
                data: updatedRequest,
            });
        } catch (error) {
            console.error("Error updating status:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update part request",
            });
        }
    },

    // DELETE /api/admin/part-requests/:id
    async destroy(req, res) {
        try {
            const deleted = await PartRequest.query().deleteById(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Part request not found",
                });
            }
            res.json({
                success: true,
                message: "Part request deleted successfully",
                data: { id: req.params.id },
            });
        } catch (error) {
            console.error("Error deleting part request:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete part request",
            });
        }
    },

    // POST /api/admin/part-requests/delete-many
    async deleteMany(req, res) {
        try {
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid input: 'ids' must be a non-empty array.",
                });
            }

            const deletedCount = await PartRequest.query()
                .delete()
                .whereIn("id", ids);

            if (deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No part requests found with the provided IDs.",
                });
            }

            res.json({
                success: true,
                message: `Successfully deleted ${deletedCount} part requests`,
                data: { deletedCount, deletedIds: ids },
            });
        } catch (error) {
            console.error("Error bulk deleting part requests:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete part requests",
            });
        }
    },
};
