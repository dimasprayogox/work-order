import { PartRequest } from "../../models/PartRequest.js";
import { PartRequestItem } from "../../models/PartRequestItem.js";
import { updatePartRequestStatusSchema } from "../../schemas/logistics/partRequestSchema.js";
import { Part } from "../../models/Part.js";

export const PartRequestController = {
    async index(req, res) {
        const requests = await PartRequest.query().withGraphFetched('[items.part, requestedBy]');
        res.json({ success: true, data: requests });
    },

    async updateStatus(req, res) {
        const { id } = req.params;
        const parsed = updatePartRequestStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
        }

        const request = await PartRequest.query().findById(id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        // Update items if provided
        if (parsed.data.items) {
            for (const item of parsed.data.items) {
                await PartRequestItem.query()
                    .findById(item.item_id)
                    .patch({
                        approved_quantity: item.approved_quantity,
                        note: item.note
                    });
            }
        }

        // If fulfilled, reduce part stock
        if (parsed.data.status === "fulfilled") {
            const items = await PartRequestItem.query().where('part_request_id', id);
            for (const item of items) {
                if (item.approved_quantity > 0) {
                    await Part.query().findById(item.part_id).decrement('quantity_in_stock', item.approved_quantity);
                }
            }
        }

        const updatedRequest = await PartRequest.query().patchAndFetchById(id, {
            status: parsed.data.status,
            note: parsed.data.note,
            updated_at: new Date()
        });

        res.json({ success: true, message: "Request updated", data: updatedRequest });
    }
};
