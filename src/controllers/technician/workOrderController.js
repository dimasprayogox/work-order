import { WorkOrder } from "../../models/WorkOrder.js";
import { Issue } from "../../models/Issue.js";
import { Machine } from "../../models/Machine.js";
import { PartRequest } from "../../models/PartRequest.js";
import { PartUsage } from "../../models/PartUsage.js";
import { updateWorkOrderSchema } from "../../schemas/technician/workOrderSchema.js";

export const WorkOrderController = {
    /**
     * @description Ambil semua Work Order yang ditugaskan ke teknisi login
     * @route GET /technician/work-orders
     */
    async getMyWorkOrders(req, res) {
        try {
            const technicianId = req.user.userId;

            const workOrders = await WorkOrder.query()
                .where("assigned_to_id", technicianId)
                .withGraphFetched("[issue, machine, assignedTo, partRequests]")
                .orderBy("created_at", "desc");

            if (!workOrders || workOrders.length === 0) {
                return res.status(200).json({
                    message: "No work orders assigned to you.",
                    data: []
                });
            }

            res.status(200).json({
                message: "Work orders fetched successfully.",
                data: workOrders
            });
        } catch (err) {
            console.error("Error fetching work orders for technician:", err);
            res.status(500).json({
                message: "Failed to fetch work orders",
                error: err.message
            });
        }
    },

    /**
     * @description Update status dan catatan work order milik teknisi
     * @route PATCH /technician/work-orders/:id
     */
   async updateWorkOrder(req, res) {
        try {
            const id = req.params.id;
            const technicianId = req.user.userId;

            const parsed = updateWorkOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors
                });
            }

            const { status, description, started_at, completed_at } = parsed.data;

            const workOrder = await WorkOrder.query().findById(id);
            if (!workOrder) {
                return res.status(404).json({ message: "Work Order not found." });
            }

            if (workOrder.assigned_to_id !== technicianId) {
                return res.status(403).json({ message: "Forbidden. You are not authorized to update this work order." });
            }

            // Check if there are any part requests for this work order
            const partRequests = await PartRequest.query()
                .where("work_order_id", id);

            // If there are part requests, ensure at least one is fulfilled
            if (partRequests.length > 0) {
                const hasFulfilled = await PartRequest.query()
                    .where("work_order_id", id)
                    .where("status", "fulfilled")
                    .resultSize();

                if (hasFulfilled === 0) {
                    return res.status(400).json({
                        message: "Cannot update work order. No fulfilled part requests found."
                    });
                }
            }

            // Validasi waktu berdasarkan status
            if (status === "in_progress" && !started_at) {
                return res.status(400).json({ message: "started_at is required when status is 'in_progress'." });
            }
            if (status === "completed" && !completed_at) {
                return res.status(400).json({ message: "completed_at is required when status is 'completed'." });
            }

            // Cek part usage jika status ingin diubah ke 'completed'
            if (status === "completed") {
                const requests = await PartRequest.query()
                    .where("work_order_id", id)
                    .whereIn("status", ["approved", "fulfilled"])
                    .withGraphFetched("items");

                // Only check part usage if there are part requests
                if (requests.length > 0) {
                    for (const request of requests) {
                        for (const item of request.items) {
                            const totalUsed = await PartUsage.query()
                                .where("work_order_id", id)
                                .andWhere("part_id", item.part_id)
                                .sum("quantity_used as total")
                                .first();

                            if ((totalUsed.total || 0) < (item.quantity_approved || 0)) {
                                return res.status(400).json({
                                    message: `Cannot complete work order. Approved part (ID: ${item.part_id}) has not been fully used.`
                                });
                            }
                        }
                    }
                }
            }

            const updatedWorkOrder = await workOrder.$query().patchAndFetch({
                status,
                description,
                started_at: status === "in_progress" ? started_at : workOrder.started_at,
                completed_at: status === "completed" ? completed_at : null,
            });

            // Update status issue sesuai status work order
            if (workOrder.issue_id) {
                if (status === "in_progress") {
                    await Issue.query().patchAndFetchById(workOrder.issue_id, { status: "in_progress" });
                } else if (status === "completed") {
                    await Issue.query().patchAndFetchById(workOrder.issue_id, { status: "resolved" });
                }
            }

            // Jika work order selesai, update status mesin ke 'operational'
            if (status === "completed" && workOrder.machine_id) {
                await Machine.query().patchAndFetchById(workOrder.machine_id, { status: "operational" });
            }

            res.status(200).json({
                message: `Work order successfully updated to '${status}'.`,
                data: updatedWorkOrder
            });
        } catch (err) {
            console.error("Error updating work order:", err);
            res.status(500).json({ message: "Failed to update work order", error: err.message });
        }
    },

    /**
     * @description Ambil semua Work Request yang dibuat oleh user login
     * @route GET /technician/my-work-requests
     */
    async getMyWorkRequests(req, res) {
        try {
            const userId = req.user.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required: User ID not found."
                });
            }

            const myWorkRequests = await WorkOrder.query()
                .where("created_by_id", userId)
                .withGraphFetched("[machine, issue, createdBy]")
                .select(
                    "work_orders.id",
                    "work_orders.status",
                    "work_orders.created_at as submittedDate",
                    "work_orders.description",
                    "issue.title as type",
                    "issue.description as issue_description"
                )
                .leftJoin("issues as issue", "work_orders.issue_id", "issue.id")
                .orderBy("work_orders.created_at", "desc");

            const formattedRequests = myWorkRequests.map((wo) => ({
                id: wo.id,
                description: wo.description || wo.issue_description || "N/A",
                status: wo.status,
                submittedDate: wo.submittedDate
                    ? new Date(wo.submittedDate).toISOString().slice(0, 10)
                    : "N/A",
                type: wo.type || "General Request"
            }));

            res.json({ success: true, data: formattedRequests });
        } catch (err) {
            console.error("Error in WorkOrderController.getMyWorkRequests:", err);
            res.status(500).json({
                success: false,
                message: err.message || "Failed to fetch my work requests."
            });
        }
    }
};
