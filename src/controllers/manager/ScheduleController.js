import { MaintenanceSchedule as Schedule } from "../../models/MaintenanceSchedule.js";
import { WorkOrder } from "../../models/WorkOrder.js";
import { User } from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";
import {
  createScheduleSchema,
  updateScheduleSchema,
} from "../../schemas/manager/scheduleSchema.js";
import { db } from "../../core/config/knex.js";

const pad = (n) => n.toString().padStart(2, "0");
const formatDateTime = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
};

export const ScheduleController = {
  async index(req, res) {
    try {
      const userId = req.user.userId;

      const userData = await db("users")
        .leftJoin("divisions", "users.division_id", "divisions.id")
        .where("users.id", userId)
        .select("users.division_id")
        .first();

      const userDivisionId = userData?.division_id;

      if (!userDivisionId) {
        return res.json({ success: true, data: [] });
      }

      // Return schedules that are related to machines/assets in the user's division
      // or related to global machines/assets (division_id IS NULL). Also always
      // include schedules created by the requesting user so they can see their
      // own schedules regardless of the asset/machine division linkage.
      const schedules = await Schedule.query()
        .withGraphFetched("[machine, asset, createdBy]")
        .where((builder) => {
          builder
            .whereExists(
              Schedule.relatedQuery("machine").where(function () {
                this.where(function () {
                  this.where("division_id", userDivisionId).orWhereNull("division_id");
                }).andWhere("status", "operational");
              })
            )
            .orWhereExists(
              Schedule.relatedQuery("asset").where(function () {
                this.where(function () {
                  this.where("division_id", userDivisionId).orWhereNull("division_id");
                }).andWhere("status", "operational");
              })
            )
            .orWhere("created_by_id", userId);
        })
        .orderBy("created_at", "desc");

      res.json({ success: true, data: schedules });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async show(req, res) {
    try {
      const { id } = req.params;
      const schedule = await Schedule.query()
        .findById(id)
        .withGraphFetched("[machine, asset, createdBy]");

      if (!schedule) {
        return res
          .status(404)
          .json({ success: false, message: "Schedule not found" });
      }

      res.json({ success: true, data: schedule });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const parsed = createScheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ success: false, errors: parsed.error.flatten() });
      }

      const data = parsed.data;

      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User ID not available.",
        });
      }

      const creatingUser = await User.query().findById(req.user.userId);
      if (!creatingUser) {
        return res.status(400).json({
          success: false,
          message: `User with ID ${req.user.userId} not found.`,
        });
      }

      const schedule = await Schedule.query().insert({
        id: uuidv4(),
        created_by_id: req.user.userId,
        next_due_date: data.next_due_date,
        title: data.title,
        description: data.description,
        type: data.type,
        machine_id: data.machine_id || null,
        asset_id: data.asset_id || null,
        frequency: data.frequency,
        priority: data.priority,
        is_active: data.is_active !== undefined ? data.is_active : true,
      });

      res.status(201).json({ success: true, data: schedule });
    } catch {
      res.status(500).json({
        success: false,
        message: "Internal server error while creating schedule.",
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const parsed = updateScheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ success: false, errors: parsed.error.flatten() });
      }

      const updated = await Schedule.query().patchAndFetchById(id, parsed.data);

      res.json({ success: true, data: updated });
    } catch {
      res.status(500).json({
        success: false,
        message: "Internal server error while updating schedule.",
      });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await Schedule.query().deleteById(id);
      res.json({ success: true, message: "Schedule deleted" });
    } catch {
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server internal saat menghapus jadwal.",
      });
    }
  },

  async deleteMany(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid input: 'ids' must be a non-empty array of schedule IDs.",
        });
      }

      // Check if all schedules exist
      const existingSchedules = await Schedule.query().whereIn("id", ids);
      if (existingSchedules.length !== ids.length) {
        const existingIds = existingSchedules.map((s) => s.id);
        const missingIds = ids.filter((id) => !existingIds.includes(id));
        return res.status(404).json({
          success: false,
          message: `Some schedules not found: ${missingIds.join(", ")}`,
        });
      }

      // Delete the schedules
      const deleteCount = await Schedule.query().delete().whereIn("id", ids);

      res.json({
        success: true,
        message: `Successfully deleted ${deleteCount} schedules`,
        data: { deletedCount: deleteCount },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server internal saat menghapus jadwal.",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  },

async generateDueWorkOrders(req, res) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: 'ids' must be a non-empty array of schedule IDs.",
      });
    }

    const now = new Date().toISOString();

    // Get only the specified schedules that are due and active
    const dueSchedules = await Schedule.query()
      .whereIn("id", ids)
      .where("next_due_date", "<=", now)
      .where("is_active", 1)
      .withGraphFetched("[machine, asset]");

    if (dueSchedules.length === 0) {
      return res.json({
        success: true,
        message: "No due schedules found for the provided IDs",
        data: []
      });
    }

    const createdWOs = [];

    for (const schedule of dueSchedules) {
      const existingWO = await WorkOrder.query()
        .where("title", schedule.title)
        .where(function () {
          if (schedule.type === "machine") {
            this.where("machine_id", schedule.machine_id);
          } else {
            this.where("asset_id", schedule.asset_id);
          }
        })
        .where("scheduled_date", schedule.next_due_date)
        .first();

      if (existingWO) continue;

      const newWO = await WorkOrder.query().insert({
        id: uuidv4(),
        title: schedule.title,
        description: `Scheduled maintenance: ${schedule.title}`,
        machine_id: schedule.type === "machine" ? schedule.machine_id : null,
        asset_id: schedule.type === "asset" ? schedule.asset_id : null,
        created_by_id: schedule.created_by_id,
        priority: "medium",
        scheduled_date: schedule.next_due_date,
        status: "pending",
      });

      const nextDate = new Date(schedule.next_due_date);
      if (schedule.frequency === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (schedule.frequency === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (schedule.frequency === "daily") {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (schedule.frequency === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      await Schedule.query().patchAndFetchById(schedule.id, {
        next_due_date: formatDateTime(nextDate),
      });

      createdWOs.push(newWO);
    }

    res.json({
      success: true,
      message: `Generated ${createdWOs.length} work orders from ${dueSchedules.length} due schedules`,
      data: createdWOs,
    });
    } catch {
      res.status(500).json({
        success: false,
        message: "Internal server error while generating due work orders.",
      });
    }
},
};