import { WorkOrder } from '../../models/WorkOrder.js';
import { User } from '../../models/User.js';
import { Issue } from '../../models/Issue.js';
import { assignWorkOrderSchema, bulkAssignWorkOrderSchema, reassignWorkOrderSchema } from '../../schemas/admin/workOrderAssignmentSchema.js';
import { v4 as uuidv4 } from 'uuid';

export const WorkOrderAssignmentController = {
    // Get all work orders with assignment status
    async index(req, res) {
        try {
            const { status, assigned, priority, machine_id } = req.query;
            
            let query = WorkOrder.query()
                .withGraphFetched('[machine, assignedTo, createdBy, issue]')
                .orderBy('created_at', 'desc');

            // Filter berdasarkan parameter
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

            // Tambahkan current_workload ke assignedTo
            for (const wo of workOrders) {
                if (wo.assignedTo) {
                    const activeCount = await WorkOrder.query()
                        .where('assigned_to_id', wo.assignedTo.id)
                        .whereIn('status', ['pending', 'in_progress'])
                        .resultSize();
                    wo.assignedTo.current_workload = activeCount;
                }
            }
            
            res.json({ 
                success: true, 
                data: workOrders,
                meta: {
                    total: workOrders.length,
                    unassigned: workOrders.filter(wo => !wo.assigned_to_id).length,
                    assigned: workOrders.filter(wo => wo.assigned_to_id).length
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Get available technicians for assignment
    async getAvailableTechnicians(req, res) {
        try {
            const technicians = await User.query()
                .where('role', 'technician')
                .where('is_active', true)
                .withGraphFetched('assignedWorkOrders(activeWorkOrders)')
                .modifiers({
                    activeWorkOrders(builder) {
                        builder.whereIn('status', ['pending', 'in_progress']);
                    }
                });

            // Hitung workload setiap teknisi
            const techniciansWithWorkload = technicians.map(tech => ({
                ...tech,
                current_workload: tech.assignedWorkOrders?.length || 0
            }));

            res.json({ success: true, data: techniciansWithWorkload });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Assign work order to technician
    async assignWorkOrder(req, res) {
        try {
            const parsed = assignWorkOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const { work_order_id, assigned_to_id, priority, scheduled_date, notes } = parsed.data;

            // Cek apakah work order exists
            const workOrder = await WorkOrder.query().findById(work_order_id);
            if (!workOrder) {
                return res.status(404).json({ success: false, message: 'Work Order not found' });
            }

            // Cek apakah technician exists dan aktif
            const technician = await User.query()
                .findById(assigned_to_id)
                .where('role', 'technician')
                .where('is_active', true);
            
            if (!technician) {
                return res.status(404).json({ success: false, message: 'Technician not found or inactive' });
            }

            // Update work order
            const updateData = {
                assigned_to_id,
                status: workOrder.status === 'pending' ? 'pending' : workOrder.status,
                updated_at: new Date()
            };

            if (priority) updateData.priority = priority;
            if (scheduled_date) updateData.scheduled_date = scheduled_date;
            if (notes) updateData.notes = notes;

            const updatedWorkOrder = await WorkOrder.query()
                .patchAndFetchById(work_order_id, updateData)
                .withGraphFetched('[machine, assignedTo, createdBy, issue]');

            res.json({ 
                success: true, 
                data: updatedWorkOrder,
                message: `Work Order berhasil ditugaskan ke ${technician.name}`
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Bulk assign multiple work orders
    async bulkAssign(req, res) {
        try {
            const parsed = bulkAssignWorkOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const { assignments } = parsed.data;
            const results = [];
            const errors = [];

            for (const assignment of assignments) {
                try {
                    const workOrder = await WorkOrder.query().findById(assignment.work_order_id);
                    if (!workOrder) {
                        errors.push({ work_order_id: assignment.work_order_id, error: 'Work Order not found' });
                        continue;
                    }

                    const technician = await User.query()
                        .findById(assignment.assigned_to_id)
                        .where('role', 'technician')
                        .where('is_active', true);
                    
                    if (!technician) {
                        errors.push({ work_order_id: assignment.work_order_id, error: 'Technician not found or inactive' });
                        continue;
                    }

                    const updateData = {
                        assigned_to_id: assignment.assigned_to_id,
                        updated_at: new Date()
                    };

                    if (assignment.priority) updateData.priority = assignment.priority;
                    if (assignment.scheduled_date) updateData.scheduled_date = assignment.scheduled_date;

                    const updated = await WorkOrder.query().patchAndFetchById(assignment.work_order_id, updateData);
                    results.push(updated);
                } catch (err) {
                    errors.push({ work_order_id: assignment.work_order_id, error: err.message });
                }
            }

            res.json({ 
                success: true, 
                data: {
                    successful_assignments: results.length,
                    failed_assignments: errors.length,
                    results,
                    errors
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Reassign work order to different technician
    async reassignWorkOrder(req, res) {
        try {
            const { id } = req.params;
            const parsed = reassignWorkOrderSchema.safeParse(req.body);
            
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const { new_assigned_to_id, reason, priority } = parsed.data;

            const workOrder = await WorkOrder.query()
                .findById(id)
                .withGraphFetched('assignedTo');
            
            if (!workOrder) {
                return res.status(404).json({ success: false, message: 'Work Order not found' });
            }

            if (workOrder.status === 'completed') {
                return res.status(400).json({ success: false, message: 'Cannot reassign completed work order' });
            }

            const newTechnician = await User.query()
                .findById(new_assigned_to_id)
                .where('role', 'technician')
                .where('is_active', true);
            
            if (!newTechnician) {
                return res.status(404).json({ success: false, message: 'New technician not found or inactive' });
            }

            const updateData = {
                assigned_to_id: new_assigned_to_id,
                updated_at: new Date()
            };

            if (priority) updateData.priority = priority;
            if (reason) updateData.notes = `${workOrder.notes || ''}\n[REASSIGNED] ${reason}`.trim();

            const updatedWorkOrder = await WorkOrder.query()
                .patchAndFetchById(id, updateData)
                .withGraphFetched('[machine, assignedTo, createdBy, issue]');

            res.json({ 
                success: true, 
                data: updatedWorkOrder,
                message: `Work Order berhasil dipindahkan ke ${newTechnician.name}`
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Remove assignment from work order
    async unassignWorkOrder(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const workOrder = await WorkOrder.query().findById(id);
            if (!workOrder) {
                return res.status(404).json({ success: false, message: 'Work Order not found' });
            }

            if (workOrder.status === 'completed') {
                return res.status(400).json({ success: false, message: 'Cannot unassign completed work order' });
            }

            if (workOrder.status === 'in_progress') {
                return res.status(400).json({ success: false, message: 'Cannot unassign work order in progress' });
            }

            const updateData = {
                assigned_to_id: null,
                status: 'pending',
                updated_at: new Date()
            };

            if (reason) {
                updateData.notes = `${workOrder.notes || ''}\n[UNASSIGNED] ${reason}`.trim();
            }

            const updatedWorkOrder = await WorkOrder.query()
                .patchAndFetchById(id, updateData)
                .withGraphFetched('[machine, assignedTo, createdBy, issue]');

            res.json({ 
                success: true, 
                data: updatedWorkOrder,
                message: 'Assignment berhasil dibatalkan'
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Get assignment statistics
    async getAssignmentStats(req, res) {
        try {
            const stats = await WorkOrder.query()
                .select('status')
                .count('* as count')
                .groupBy('status');

            const technicianStats = await User.query()
                .where('role', 'technician')
                .where('is_active', true)
                .withGraphFetched('assignedWorkOrders(activeWorkOrders)')
                .modifiers({
                    activeWorkOrders(builder) {
                        builder.whereIn('status', ['pending', 'in_progress']);
                    }
                });

            const workloadStats = technicianStats.map(tech => ({
                technician_id: tech.id,
                technician_name: tech.name,
                active_work_orders: tech.assignedWorkOrders?.length || 0
            }));

            res.json({ 
                success: true, 
                data: {
                    work_order_stats: stats,
                    technician_workload: workloadStats,
                    summary: {
                        total_technicians: technicianStats.length,
                        avg_workload: workloadStats.reduce((sum, tech) => sum + tech.active_work_orders, 0) / technicianStats.length
                    }
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};