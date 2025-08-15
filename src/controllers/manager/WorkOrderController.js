import { WorkOrder } from "../../models/WorkOrder.js";
import { Issue } from "../../models/Issue.js";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../models/User.js";
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  assignWorkOrderSchema,
  bulkAssignWorkOrderSchema,
  reassignWorkOrderSchema,
} from "../../schemas/manager/workOrderSchema.js";
import { db } from "../../core/config/knex.js";

export const WorkOrderController = {
  async index(req, res) {
    try {
      const workOrders = await WorkOrder.query()
        .withGraphFetched("[machine, assignedTo, createdBy, issue]")
        .orderBy("created_at", "desc");

      // Add workload and profile photo for each assigned technician
      for (const wo of workOrders) {
        if (wo.assignedTo) {
          const activeCount = await WorkOrder.query()
            .where("assigned_to_id", wo.assignedTo.id)
            .whereIn("status", ["pending", "in_progress"])
            .resultSize();

          wo.assignedTo.current_workload = activeCount;

          // Get profile photo from user_details
          const userDetail = await db("user_details")
            .where("user_id", wo.assignedTo.id)
            .select("profile_photo_url")
            .first();

          wo.assignedTo.profile_photo_url =
            userDetail?.profile_photo_url || null;
        }
      }

      res.json({ success: true, data: workOrders });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async show(req, res) {
    try {
      const { id } = req.params;
      const workOrder = await WorkOrder.query()
        .findById(id)
        .withGraphFetched("[machine, assignedTo, createdBy, issue]");

      if (!workOrder) {
        return res
          .status(404)
          .json({ success: false, message: "Work Order not found" });
      }

      // Add workload and profile photo if assigned
      if (workOrder.assignedTo) {
        const activeCount = await WorkOrder.query()
          .where("assigned_to_id", workOrder.assignedTo.id)
          .whereIn("status", ["pending", "in_progress"])
          .resultSize();

        workOrder.assignedTo.current_workload = activeCount;

        // Get profile photo from user_details
        const userDetail = await db("user_details")
          .where("user_id", workOrder.assignedTo.id)
          .select("profile_photo_url")
          .first();

        workOrder.assignedTo.profile_photo_url =
          userDetail?.profile_photo_url || null;
      }

      res.json({ success: true, data: workOrder });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const parsed = createWorkOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ success: false, errors: parsed.error.flatten() });
      }

      const data = parsed.data;
      const newWOId = uuidv4();

      const newWO = await WorkOrder.query().insert({
        id: newWOId,
        ...data,
        status: "pending",
        created_by_id: req.user.userId,
      });

      if (data.issue_id) {
        await Issue.query()
          .patch({ work_order_id: newWOId })
          .where("id", data.issue_id);
      }

      res.status(201).json({ success: true, data: newWO });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const parsed = updateWorkOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ success: false, errors: parsed.error.flatten() });
      }

      const data = parsed.data;
      const existingWO = await WorkOrder.query().findById(id);

      if (!existingWO) {
        return res
          .status(404)
          .json({ success: false, message: "Work Order not found" });
      }

      if (data.scheduled_date) {
        const newDate = new Date(data.scheduled_date);
        const now = new Date();

        if (newDate.getTime() < now.getTime()) {
          return res.status(400).json({
            success: false,
            message: "Tanggal penjadwalan tidak boleh di masa lalu.",
          });
        }
      }

      await WorkOrder.query().patchAndFetchById(id, data);

      const updatedWOWithRelations = await WorkOrder.query()
        .findById(id)
        .withGraphFetched("[machine, assignedTo, createdBy, issue]");

      res.json({ success: true, data: updatedWOWithRelations });
    } catch (err) {
      console.error("Error updating work order:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const existingWO = await WorkOrder.query().findById(id);
      if (!existingWO) {
        return res
          .status(404)
          .json({ success: false, message: "Work Order tidak ditemukan." });
      }

      if (existingWO.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Hanya Work Order 'pending' yang dapat dihapus.",
        });
      }

      await WorkOrder.query().deleteById(id);
      res.json({ success: true, message: "Work Order berhasil dihapus." });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteMany(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid input: 'ids' must be a non-empty array of work order IDs.",
        });
      }

      // Check if all work orders exist
      const existingWOs = await WorkOrder.query().whereIn("id", ids);
      if (existingWOs.length !== ids.length) {
        const existingIds = existingWOs.map((wo) => wo.id);
        const missingIds = ids.filter((id) => !existingIds.includes(id));
        return res.status(404).json({
          success: false,
          message: `Some work orders not found: ${missingIds.join(", ")}`,
        });
      }
      // Delete the work orders
      const deleteCount = await WorkOrder.query().delete().whereIn("id", ids);

      res.json({
        success: true,
        message: `Successfully deleted ${deleteCount} work orders`,
        data: { deletedCount: deleteCount },
      });
    } catch (err) {
      console.error("Error in deleteMany work orders:", err);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server internal saat menghapus work order.",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  },

  async overdue(req, res) {
    try {
      const now = new Date().toISOString();
      const overdue = await WorkOrder.query()
        .where("scheduled_date", "<", now)
        .whereNot("status", "completed")
        .withGraphFetched("[machine, assignedTo]");

      res.json({ success: true, data: overdue });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAvailableTechnicians(req, res) {
    try {
      // Get technicians with their profile photos
      const technicians = await db("users")
        .leftJoin("user_details", "users.id", "user_details.user_id")
        .where("users.role", "technician")
        .where("users.is_active", true)
        .select(
          "users.id",
          "users.full_name",
          "users.email",
          "users.username",
          "user_details.profile_photo_url"
        );

      // Calculate current workload for each technician
      for (const technician of technicians) {
        const activeWorkOrders = await WorkOrder.query()
          .where("assigned_to_id", technician.id)
          .whereIn("status", ["pending", "in_progress"])
          .resultSize();

        technician.current_workload = activeWorkOrders;
      }

      res.json({
        success: true,
        data: technicians,
      });
    } catch (err) {
      console.error(
        "Error in WorkOrderAssignmentController.getAvailableTechnicians:",
        err
      );
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Get assignment statistics
  async getAssignmentStats(req, res) {
    try {
      const totalWorkOrders = await WorkOrder.query().resultSize();

      const assignedWorkOrders = await WorkOrder.query()
        .whereNotNull("assigned_to_id")
        .resultSize();

      const unassignedWorkOrders = await WorkOrder.query()
        .whereNull("assigned_to_id")
        .resultSize();

      const pendingWorkOrders = await WorkOrder.query()
        .where("status", "pending")
        .resultSize();

      const inProgressWorkOrders = await WorkOrder.query()
        .where("status", "in_progress")
        .resultSize();

      const completedWorkOrders = await WorkOrder.query()
        .where("status", "completed")
        .resultSize();

      const totalTechnicians = await User.query()
        .where("role", "technician")
        .where("is_active", true)
        .resultSize();

      const stats = {
        total_work_orders: totalWorkOrders,
        assigned_work_orders: assignedWorkOrders,
        unassigned_work_orders: unassignedWorkOrders,
        pending_work_orders: pendingWorkOrders,
        in_progress_work_orders: inProgressWorkOrders,
        completed_work_orders: completedWorkOrders,
        total_technicians: totalTechnicians,
        assignment_rate:
          totalWorkOrders > 0
            ? ((assignedWorkOrders / totalWorkOrders) * 100).toFixed(1)
            : 0,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      console.error(
        "Error in WorkOrderAssignmentController.getAssignmentStats:",
        err
      );
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
          message: "Validation failed",
          errors: parsed.error.errors,
        });
      }

      const { work_order_id, assigned_to_id, priority, scheduled_date, notes } =
        parsed.data;

      // Check if work order exists
      const workOrder = await WorkOrder.query().findById(work_order_id);
      if (!workOrder) {
        return res.status(404).json({
          success: false,
          message: "Work order not found",
        });
      }

      // Check if technician exists
      const technician = await User.query()
        .findById(assigned_to_id)
        .where("role", "technician")
        .where("is_active", true);

      if (!technician) {
        return res.status(404).json({
          success: false,
          message: "Technician not found or inactive",
        });
      }

      // Update work order
      const updatedWorkOrder = await WorkOrder.query()
        .patchAndFetchById(work_order_id, {
          assigned_to_id,
          priority: priority || workOrder.priority,
          scheduled_date,
          notes,
          status: "pending",
        })
        .withGraphFetched("[assignedTo, machine, issue]");

      res.json({
        success: true,
        message: "Work order assigned successfully",
        data: updatedWorkOrder,
      });
    } catch (err) {
      console.error(
        "Error in WorkOrderAssignmentController.assignWorkOrder:",
        err
      );
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
          message: "Validation failed",
          errors: parsed.error.errors,
        });
      }

      const { assignments } = parsed.data;
      const results = [];

      for (const assignment of assignments) {
        try {
          const updatedWorkOrder = await WorkOrder.query().patchAndFetchById(
            assignment.work_order_id,
            {
              assigned_to_id: assignment.assigned_to_id,
              priority: assignment.priority,
              scheduled_date: assignment.scheduled_date,
              status: "pending",
            }
          );

          results.push({
            work_order_id: assignment.work_order_id,
            success: true,
            data: updatedWorkOrder,
          });
        } catch (err) {
          results.push({
            work_order_id: assignment.work_order_id,
            success: false,
            error: err.message,
          });
        }
      }

      res.json({
        success: true,
        message: "Bulk assignment completed",
        data: results,
      });
    } catch (err) {
      console.error("Error in WorkOrderAssignmentController.bulkAssign:", err);
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
          message: "Validation failed",
          errors: parsed.error.errors,
        });
      }

      const { new_assigned_to_id, reason, priority } = parsed.data;

      const workOrder = await WorkOrder.query().findById(id);
      if (!workOrder) {
        return res.status(404).json({
          success: false,
          message: "Work order not found",
        });
      }

      const updatedWorkOrder = await WorkOrder.query()
        .patchAndFetchById(id, {
          assigned_to_id: new_assigned_to_id,
          priority: priority || workOrder.priority,
          notes: reason,
        })
        .withGraphFetched("[assignedTo, machine, issue]");

      res.json({
        success: true,
        message: "Work order reassigned successfully",
        data: updatedWorkOrder,
      });
    } catch (err) {
      console.error(
        "Error in WorkOrderAssignmentController.reassignWorkOrder:",
        err
      );
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
          message: "Work order not found",
        });
      }

      const updatedWorkOrder = await WorkOrder.query()
        .patchAndFetchById(id, {
          assigned_to_id: null,
          status: "pending",
        })
        .withGraphFetched("[machine, issue]");

      res.json({
        success: true,
        message: "Work order unassigned successfully",
        data: updatedWorkOrder,
      });
    } catch (err) {
      console.error(
        "Error in WorkOrderAssignmentController.unassignWorkOrder:",
        err
      );
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
