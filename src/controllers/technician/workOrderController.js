import { WorkOrder } from "../../models/WorkOrder.js";
import { Issue } from "../../models/Issue.js";
import { Machine } from "../../models/Machine.js";
import { updateWorkOrderSchema } from "../../schemas/technician/workOrderSchema.js";

export const TechnicianController = {
    /**
     * @description Get all work orders assigned to the logged-in technician
     * @route GET /api/technician/work-orders
     */
    async getMyWorkOrders(req, res) {
        try {
            const technicianId = req.user.userId; // Diambil dari middleware otentikasi

            const workOrders = await WorkOrder.query()
                .where("assigned_to", technicianId)
                .withGraphFetched('[issue, machine]') // Ambil juga data issue dan mesin terkait
                .orderBy('created_at', 'desc');

            if (!workOrders || workOrders.length === 0) {
                return res.status(404).json({ message: "No work orders assigned to you." });
            }

            res.status(200).json({
                message: "Work orders fetched successfully.",
                data: workOrders,
            });

        } catch (err) {
            console.error("Error fetching work orders:", err);
            res.status(500).json({ message: "Failed to fetch work orders", error: err.message });
        }
    },

    /**
     * @description Update a specific work order's status and description.
     * @route PATCH /api/technician/work-orders/:id
     */
    async updateWorkOrder(req, res) {
        try {
            const { id } = req.params; // ID dari work order yang akan diupdate
            const technicianId = req.user.userId;

            // 1. Validasi input dari body
            const parsed = updateWorkOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }
            const { status, description } = parsed.data;

            // 2. Cari work order berdasarkan ID
            const workOrder = await WorkOrder.query().findById(id);
            if (!workOrder) {
                return res.status(404).json({ message: "Work Order not found." });
            }

            // 3. Otorisasi: Pastikan teknisi hanya bisa mengubah WO miliknya sendiri
            if (workOrder.assigned_to !== technicianId) {
                return res.status(403).json({ message: "Forbidden. You are not authorized to update this work order." });
            }

            // 4. Lakukan update pada work order
            const updatedWorkOrder = await workOrder.$query().patchAndFetch({
                status,
                description, // Menyimpan deskripsi/laporan dari teknisi
            });

            // 5. Logika tambahan jika pekerjaan selesai (completed)
            if (status === "completed") {
                // Update status issue terkait menjadi 'resolved'
                await Issue.query().patchAndFetchById(workOrder.issue_id, {
                    status: 'resolved',
                });

                // Update status mesin menjadi 'available'
                await Machine.query().patchAndFetchById(workOrder.machine_id, {
                    status: 'available',
                });
            }

            res.status(200).json({
                message: `Work order successfully updated to '${status}'.`,
                data: updatedWorkOrder,
            });

        } catch (err) {
            console.error("Error updating work order:", err);
            res.status(500).json({ message: "Failed to update work order", error: err.message });
        }
    },
};
