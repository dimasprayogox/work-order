// src/controllers/technician/workOrderController.js
import { WorkOrder } from "../../models/WorkOrder.js";
import { Issue } from "../../models/Issue.js";
import { Machine } from "../../models/Machine.js";
// Pastikan path ke schema ini benar
import { updateWorkOrderSchema } from "../../schemas/technician/workOrderSchema.js"; 

export const WorkOrderController = {
    /**
     * @description Get all work orders assigned to the logged-in technician
     * @route GET /api/technician/work-orders
     */
    async getMyWorkOrders(req, res) {
        try {
            const technicianId = req.user.userId; // Diambil dari middleware otentikasi

            const workOrders = await WorkOrder.query()
                // Pastikan nama kolom di database Anda adalah 'assigned_to_id' atau 'assigned_to'
                // Sesuai dengan yang disimpan di model WorkOrder
                .where("assigned_to_id", technicianId) // Asumsi nama kolom adalah assigned_to_id
                .withGraphFetched('[issue, machine, assignedTo]') // Ambil juga data issue, mesin, dan info teknisi yang di-assign
                .orderBy('created_at', 'desc');

            if (!workOrders || workOrders.length === 0) {
                // Return 200 OK dengan data kosong jika tidak ada, bukan 404
                return res.status(200).json({ message: "No work orders assigned to you.", data: [] });
            }

            res.status(200).json({
                message: "Work orders fetched successfully.",
                data: workOrders,
            });

        } catch (err) {
            console.error("Error fetching work orders for technician:", err); // Log lebih spesifik
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
            // Pastikan workOrder.assigned_to_id (atau assigned_to) sesuai dengan field di database Anda
            if (workOrder.assigned_to_id !== technicianId) { // Asumsi nama kolom adalah assigned_to_id
                return res.status(403).json({ message: "Forbidden. You are not authorized to update this work order." });
            }

            // 4. Lakukan update pada work order
            const updatedWorkOrder = await workOrder.$query().patchAndFetch({
                status,
                technician_notes: description, // Menggunakan 'description' dari frontend sebagai 'technician_notes' di backend
                                              // Pastikan ada kolom 'technician_notes' di tabel Work Order
                updated_at: new Date().toISOString(), // Tambahkan updated_at
            });

            // 5. Logika tambahan jika pekerjaan selesai (completed)
            if (status === "completed") {
                // Update status issue terkait menjadi 'resolved'
                if (workOrder.issue_id) { // Pastikan ada issue_id
                    await Issue.query().patchAndFetchById(workOrder.issue_id, {
                        status: 'resolved',
                        updated_at: new Date().toISOString(),
                    });
                }

                // Update status mesin menjadi 'available'
                if (workOrder.machine_id) { // Pastikan ada machine_id
                    await Machine.query().patchAndFetchById(workOrder.machine_id, {
                        status: 'available', // Atau 'idle', 'operational'
                        updated_at: new Date().toISOString(),
                    });
                }
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

    // --- getMyWorkRequests (Untuk Employee Dashboard) ---
    // Metode ini kita diskusikan sebelumnya untuk employee.
    // Jika Anda ingin menggunakannya, pastikan ada di sini dan dirutekan dengan benar
    // di routes/employee/workOrderRoute.js
    async getMyWorkRequests(req, res) {
        try {
            const userId = req.user.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Authentication required: User ID not found." });
            }

            const myWorkRequests = await WorkOrder.query()
                .where('created_by_id', userId) // Asumsi employee membuat WO atau issue terkait
                .withGraphFetched('[machine, issue, createdBy]')
                .select(
                    'work_orders.id',
                    'work_orders.status',
                    'work_orders.created_at as submittedDate',
                    'work_orders.description',
                    'issue.title as type', // Menggunakan judul isu sebagai type
                    'issue.description as issue_description'
                )
                .leftJoin('issues as issue', 'work_orders.issue_id', 'issue.id')
                .orderBy('work_orders.created_at', 'desc');

            const formattedRequests = myWorkRequests.map(wo => ({
                id: wo.id,
                description: wo.description || wo.issue_description || 'N/A',
                status: wo.status,
                submittedDate: wo.submittedDate ? new Date(wo.submittedDate).toISOString().slice(0, 10) : 'N/A',
                type: wo.type || 'General Request'
            }));

            res.json({ success: true, data: formattedRequests });
        } catch (err) {
            console.error("Error in WorkOrderController.getMyWorkRequests:", err);
            res.status(500).json({ success: false, message: err.message || 'Failed to fetch my work requests.' });
        }
    }
};