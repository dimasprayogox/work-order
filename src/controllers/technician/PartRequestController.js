import { PartRequest } from "../../models/PartRequest.js";
import { PartRequestItem } from "../../models/PartRequestItem.js";
import { WorkOrder } from "../../models/WorkOrder.js";
import { Part } from "../../models/Part.js";
import { v4 as uuidv4 } from "uuid";
import { createPartRequestSchema } from "../../schemas/technician/partRequestSchema.js";


export const PartRequestController = {
    // Membuat permintaan part baru oleh teknisi
    async create(req, res) {
        try {
            // Validasi input
            const parsed = createPartRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors
                });
            }

            const { workOrderId, items, note } = parsed.data;
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
                .withGraphFetched(`
                    [
                        items.[
                            part,
                            partUsages(filterByWorkOrder)
                        ],
                        requestedBy
                    ]
                `)
                .modifiers({
                    filterByWorkOrder(builder) {
                        builder.where("work_order_id", workOrderId);
                    }
                });

            res.status(200).json({ data: requests });
        } catch (err) {
            console.error("Error fetching part requests:", err);
            res.status(500).json({ message: err.message });
        }
    },

    // Mendapatkan semua Part Request milik teknisi yang login
    async getMyPartRequests(req, res) {
        try {
            const technicianId = req.user.userId;

            const requests = await PartRequest.query()
                .where("requested_by_id", technicianId)
                .withGraphFetched(`
                    [
                        workOrder,
                        items.[part, partUsages(filterByWorkOrder)],
                        requestedBy
                    ]
                `)
                .modifiers({
                    filterByWorkOrder(builder) {
                        builder.where("part_usages.work_order_id", "part_requests.work_order_id");
                    }
                })
                .orderBy("created_at", "desc");

            res.status(200).json({
                message: "All part requests fetched successfully.",
                data: requests
            });
        } catch (err) {
            console.error("Error fetching all part requests for technician:", err);
            res.status(500).json({ message: err.message });
        }
    },

     async delete(req, res) {
        try {
            const { id } = req.params;
            const technicianId = req.user.userId;

            // Cek apakah Part Request ada
            const partRequest = await PartRequest.query().findById(id);
            if (!partRequest) {
                return res.status(404).json({ message: "Part Request not found." });
            }

            // Cek otorisasi
            if (partRequest.requested_by_id !== technicianId) {
                return res.status(403).json({ message: "You are not authorized to delete this Part Request." });
            }

            // Hanya bisa hapus jika status pending
            if (partRequest.status !== "pending") {
                return res.status(400).json({ message: "Only pending requests can be deleted." });
            }

            // Hapus semua items dulu
            await PartRequestItem.query().delete().where("part_request_id", id);

            // Hapus Part Request
            await PartRequest.query().deleteById(id);

            res.status(200).json({
                message: "Part request deleted successfully."
            });
        } catch (err) {
            console.error("Error deleting part request:", err);
            res.status(500).json({ message: err.message });
        }
    },
    
    async getAllParts(req, res) {
        try {
            const parts = await Part.query();
            res.status(200).json({
                message: "All parts fetched successfully.",
                data: parts
            });
        } catch (err) {
            console.error("Error fetching parts:", err);
            res.status(500).json({ message: err.message });
        }
    }
};
