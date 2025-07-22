import { PartRequest } from "../../models/PartRequest.js";
import { PartRequestItem } from "../../models/PartRequestItem.js";
import { Part } from "../../models/Part.js";
import { WorkOrder } from "../../models/WorkOrder.js";
import { v4 as uuidv4 } from "uuid";

export const PartRequestController = {
    // Membuat permintaan part baru oleh teknisi
    async create(req, res) {
        try {
            const { workOrderId, items, note } = req.body;
            const requestedById = req.user.userId;

            // Validasi Work Order
            const workOrder = await WorkOrder.query().findById(workOrderId);
            if (!workOrder) {
                return res.status(404).json({ message: "Work Order not found." });
            }

            // Buat Part Request
            const partRequest = await PartRequest.query().insert({
                id: uuidv4(),
                work_order_id: workOrderId,
                requested_by_id: requestedById,
                note,
                status: "pending"
            });

            // Tambahkan item-item
            const partRequestItems = await Promise.all(
                items.map(item =>
                    PartRequestItem.query().insert({
                        id: uuidv4(),
                        part_request_id: partRequest.id,
                        part_id: item.partId,
                        quantity_requested: item.quantityRequested
                    })
                )
            );

            res.status(201).json({
                message: "Part request created successfully",
                data: { partRequest, partRequestItems }
            });
        } catch (err) {
            console.error("Error creating part request:", err);
            res.status(500).json({ message: err.message });
        }
    },

    // Mendapatkan semua Part Request untuk Work Order tertentu
    async getByWorkOrder(req, res) {
        try {
            const { workOrderId } = req.params;
            const requests = await PartRequest.query()
                .where("work_order_id", workOrderId)
                .withGraphFetched("[items.part, requestedBy]");
            res.status(200).json({ data: requests });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    // Update status Part Request (approve/reject)
    async updateStatus(req, res) {
        try {
            const { requestId } = req.params;
            const { status, approvals } = req.body;

            // Update status
            const updatedRequest = await PartRequest.query()
                .patchAndFetchById(requestId, { status });

            if (!updatedRequest) {
                return res.status(404).json({ message: "Part Request not found." });
            }

            // Jika disetujui, update quantity_approved di item-item
            if (status === "approved" && approvals) {
                for (const approval of approvals) {
                    await PartRequestItem.query()
                        .patch({ quantity_approved: approval.quantityApproved })
                        .where("id", approval.itemId);
                }
            }

            res.status(200).json({ message: "Status updated", data: updatedRequest });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    // Memenuhi Part Request (kurangi stok part)
    async fulfill(req, res) {
        try {
            const { requestId } = req.params;
            const request = await PartRequest.query()
                .findById(requestId)
                .withGraphFetched("items.part");

            if (!request) {
                return res.status(404).json({ message: "Part Request not found." });
            }

            if (request.status !== "approved") {
                return res.status(400).json({ message: "Request must be approved before fulfillment." });
            }

            // Kurangi stok part sesuai quantity_approved
            for (const item of request.items) {
                const part = item.part;
                if (part.quantity_in_stock < item.quantity_approved) {
                    return res.status(400).json({ message: `Not enough stock for part ${part.name}` });
                }

                await Part.query()
                    .patch({ quantity_in_stock: part.quantity_in_stock - item.quantity_approved })
                    .where("id", part.id);
            }

            // Ubah status menjadi fulfilled
            await PartRequest.query().patchAndFetchById(requestId, { status: "fulfilled" });

            res.status(200).json({ message: "Request fulfilled", data: request });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
};
