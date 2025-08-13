import { WorkOrder } from "../../models/WorkOrder.js";
import { Issue } from "../../models/Issue.js";
import { v4 as uuidv4 } from "uuid";
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
} from "../../schemas/manager/workOrderSchema.js";

export const WorkOrderController = {
  async index(req, res) {
    try {
      const workOrders = await WorkOrder.query()
        .withGraphFetched("[machine, assignedTo, createdBy, issue]")
        .orderBy("created_at", "desc");

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

  async assignTechnician(req, res) {
    try {
      const { id } = req.params;
      const { assigned_to_id, scheduled_date, notes } = req.body;

      if (!assigned_to_id || !scheduled_date) {
        return res
          .status(400)
          .json({ success: false, message: "Technician ID and Scheduled Date are required." });
      }

      const newDate = new Date(scheduled_date);
      const now = new Date();

      if (newDate.getTime() < now.getTime()) {
        return res.status(400).json({
          success: false,
          message: "Tanggal penjadwalan tidak boleh di masa lalu.",
        });
      }

      const formattedDate = newDate
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");


      const updatedWO = await WorkOrder.query().patchAndFetchById(id, {
        assigned_to_id,
        scheduled_date: formattedDate,
        notes,
      });

      if (!updatedWO) {
        return res
          .status(404)
          .json({ success: false, message: "Work Order not found." });
      }

      res.json({ success: true, data: updatedWO });
    } catch (err) {
      console.error("Error assigning technician:", err);
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
};
