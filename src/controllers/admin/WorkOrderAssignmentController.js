import { WorkOrder } from '../../models/WorkOrder.js';
import { User } from '../../models/User.js';
import { assignWorkOrderSchema, bulkAssignWorkOrderSchema, reassignWorkOrderSchema } from '../../schemas/admin/workOrderAssignmentSchema.js';
import { db } from '../../core/config/knex.js';

export const WorkOrderAssignmentController = {
    // Get all work orders with assignment status
    async index(req, res) {
        try {
            const { status, assigned, priority, machine_id, page = 1, limit = 10 } = req.query;

            let query = WorkOrder.query()
                .withGraphFetched(`[
                    machine, 
                    assignedTo,
                    createdBy, 
                    issue
                ]`)
                .orderBy('created_at', 'desc');

            // Apply filters
            if (status) {
                query = query.where('status', status);
            }

            if (assigned === 'true') {
                query = query.whereNotNull('assigned_to_id');
            } else if (assigned === 'false') {
                query = query.whereNull('assigned_to_id');
            }

            if (priority) {
                query = query.where('priority', priority);
            }

            if (machine_id) {
                query = query.where('machine_id', machine_id);
            }

            const workOrders = await query;

            // Add current_workload and profile_photo_url to assignedTo
            for (const wo of workOrders) {
                if (wo.assignedTo) {
                    const activeCount = await WorkOrder.query()
                        .where('assigned_to_id', wo.assignedTo.id)
                        .whereIn('status', ['pending', 'in_progress'])
                        .resultSize();
                    
                    wo.assignedTo.current_workload = activeCount;

                    // Get profile photo from user_details
                    const userDetail = await db('user_details')
                        .where('user_id', wo.assignedTo.id)
                        .select('profile_photo_url')
                        .first();
                    
                    wo.assignedTo.profile_photo_url = userDetail?.profile_photo_url || null;
                }
            }

            res.json({
                success: true,
                data: workOrders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: workOrders.length
                }
            });
        } catch (err) {
            console.error('Error in WorkOrderAssignmentController.index:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Get available technicians for assignment
    async getAvailableTechnicians(req, res) {
        try {
            // Get technicians with their profile photos
            const technicians = await db('users')
                .leftJoin('user_details', 'users.id', 'user_details.user_id')
                .where('users.role', 'technician')
                .where('users.is_active', true)
                .select(
                    'users.id',
                    'users.full_name',
                    'users.email',
                    'users.username',
                    'user_details.profile_photo_url'
                );

            // Calculate current workload for each technician
            for (const technician of technicians) {
                const activeWorkOrders = await WorkOrder.query()
                    .where('assigned_to_id', technician.id)
                    .whereIn('status', ['pending', 'in_progress'])
                    .resultSize();

                technician.current_workload = activeWorkOrders;
            }

            res.json({
                success: true,
                data: technicians
            });
        } catch (err) {
            console.error('Error in WorkOrderAssignmentController.getAvailableTechnicians:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Get assignment statistics
    async getAssignmentStats(req, res) {
        try {
            const totalWorkOrders = await WorkOrder.query().resultSize();
            
            const assignedWorkOrders = await WorkOrder.query()
                .whereNotNull('assigned_to_id')
                .resultSize();
            
            const unassignedWorkOrders = await WorkOrder.query()
                .whereNull('assigned_to_id')
                .resultSize();
            
            const pendingWorkOrders = await WorkOrder.query()
                .where('status', 'pending')
                .resultSize();
            
            const inProgressWorkOrders = await WorkOrder.query()
                .where('status', 'in_progress')
                .resultSize();
            
            const completedWorkOrders = await WorkOrder.query()
                .where('status', 'completed')
                .resultSize();

            const totalTechnicians = await User.query()
                .where('role', 'technician')
                .where('is_active', true)
                .resultSize();

            const stats = {
                total_work_orders: totalWorkOrders,
                assigned_work_orders: assignedWorkOrders,
                unassigned_work_orders: unassignedWorkOrders,
                pending_work_orders: pendingWorkOrders,
                in_progress_work_orders: inProgressWorkOrders,
                completed_work_orders: completedWorkOrders,
                total_technicians: totalTechnicians,
                assignment_rate: totalWorkOrders > 0 ? ((assignedWorkOrders / totalWorkOrders) * 100).toFixed(1) : 0
            };

            res.json({
                success: true,
                data: stats
            });
        } catch (err) {
            console.error('Error in WorkOrderAssignmentController.getAssignmentStats:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Assign work order to technician
    async assignWorkOrder(req, res) {
        try {
            const parsed = assignWorkOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: parsed.error.errors
                });
            }

            const { work_order_id, assigned_to_id, priority, scheduled_date, notes } = parsed.data;

            // Check if work order exists
            const workOrder = await WorkOrder.query().findById(work_order_id);
            if (!workOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Work order not found'
                });
            }

            // Check if technician exists
            const technician = await User.query()
                .findById(assigned_to_id)
                .where('role', 'technician')
                .where('is_active', true);

            if (!technician) {
                return res.status(404).json({
                    success: false,
                    message: 'Technician not found or inactive'
                });
            }

            // Update work order
            const updatedWorkOrder = await WorkOrder.query()
                .patchAndFetchById(work_order_id, {
                    assigned_to_id,
                    priority: priority || workOrder.priority,
                    scheduled_date,
                    notes,
                    status: 'pending'
                })
                .withGraphFetched('[assignedTo, machine, issue]');

            res.json({
                success: true,
                message: 'Work order assigned successfully',
                data: updatedWorkOrder
            });
        } catch (err) {
            console.error('Error in WorkOrderAssignmentController.assignWorkOrder:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Bulk assign multiple work orders
    async bulkAssign(req, res) {
        try {
            const parsed = bulkAssignWorkOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: parsed.error.errors
                });
            }

            const { assignments } = parsed.data;
            const results = [];

            for (const assignment of assignments) {
                try {
                    const updatedWorkOrder = await WorkOrder.query()
                        .patchAndFetchById(assignment.work_order_id, {
                            assigned_to_id: assignment.assigned_to_id,
                            priority: assignment.priority,
                            scheduled_date: assignment.scheduled_date,
                            status: 'pending'
                        });

                    results.push({
                        work_order_id: assignment.work_order_id,
                        success: true,
                        data: updatedWorkOrder
                    });
                } catch (err) {
                    results.push({
                        work_order_id: assignment.work_order_id,
                        success: false,
                        error: err.message
                    });
                }
            }

            res.json({
                success: true,
                message: 'Bulk assignment completed',
                data: results
            });
        } catch (err) {
            console.error('Error in WorkOrderAssignmentController.bulkAssign:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Reassign work order to different technician
    async reassignWorkOrder(req, res) {
        try {
            const { id } = req.params;
            const parsed = reassignWorkOrderSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: parsed.error.errors
                });
            }

            const { new_assigned_to_id, reason, priority } = parsed.data;

            const workOrder = await WorkOrder.query().findById(id);
            if (!workOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Work order not found'
                });
            }

            const updatedWorkOrder = await WorkOrder.query()
                .patchAndFetchById(id, {
                    assigned_to_id: new_assigned_to_id,
                    priority: priority || workOrder.priority,
                    notes: reason
                })
                .withGraphFetched('[assignedTo, machine, issue]');

            res.json({
                success: true,
                message: 'Work order reassigned successfully',
                data: updatedWorkOrder
            });
        } catch (err) {
            console.error('Error in WorkOrderAssignmentController.reassignWorkOrder:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Remove assignment from work order
    async unassignWorkOrder(req, res) {
        try {
            const { id } = req.params;

            const workOrder = await WorkOrder.query().findById(id);
            if (!workOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Work order not found'
                });
            }

            const updatedWorkOrder = await WorkOrder.query()
                .patchAndFetchById(id, {
                    assigned_to_id: null,
                    status: 'pending'
                })
                .withGraphFetched('[machine, issue]');

            res.json({
                success: true,
                message: 'Work order unassigned successfully',
                data: updatedWorkOrder
            });
        } catch (err) {
            console.error('Error in WorkOrderAssignmentController.unassignWorkOrder:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
};