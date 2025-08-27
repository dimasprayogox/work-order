import { Machine } from "../../models/Machine.js";
import { WorkOrder } from "../../models/WorkOrder.js";

export const DashboardController = {
  async overview(req, res) {
    try {
      const userDivisionId = req.user?.division_id;

      // Query untuk machine status dengan filter division
      const machineQuery = Machine.query()
        .select("status")
        .count("id as count")
        .groupBy("status");

      if (userDivisionId) {
        machineQuery.where((builder) =>
          builder
            .where("division_id", userDivisionId)
            .orWhereNull("division_id")
        );
      }

      const machineStatus = await machineQuery;

      // Query untuk work order status dengan filter division melalui machine
      const woQuery = WorkOrder.query()
        .select("work_orders.status")
        .count("work_orders.id as count")
        .leftJoin("machines", "work_orders.machine_id", "machines.id")
        .groupBy("work_orders.status");

      if (userDivisionId) {
        woQuery.where((builder) =>
          builder
            .where("machines.division_id", userDivisionId)
            .orWhereNull("machines.division_id")
        );
      }

      const woStatus = await woQuery;

      // Query untuk overdue work orders dengan filter division
      const overdueQuery = WorkOrder.query()
        .where("work_orders.status", "!=", "resolved")
        .where("scheduled_date", "<", new Date().toISOString().split("T")[0])
        .leftJoin("machines", "work_orders.machine_id", "machines.id")
        .withGraphFetched("[machine]");

      if (userDivisionId) {
        overdueQuery.where((builder) =>
          builder
            .where("machines.division_id", userDivisionId)
            .orWhereNull("machines.division_id")
        );
      }

      const overdueWOs = await overdueQuery;

      // Query untuk total work orders dengan filter division
      const totalWOQuery = WorkOrder.query().leftJoin(
        "machines",
        "work_orders.machine_id",
        "machines.id"
      );

      if (userDivisionId) {
        totalWOQuery.where((builder) =>
          builder
            .where("machines.division_id", userDivisionId)
            .orWhereNull("machines.division_id")
        );
      }

      const totalWO = await totalWOQuery.resultSize();

      const newWorkRequestsCount =
        woStatus.find((s) => s.status === "open")?.count || 0;

      const brokenMachines =
        machineStatus.find((s) => s.status === "broken")?.count || 0;
      const maintenanceMachines =
        machineStatus.find((s) => s.status === "maintenance")?.count || 0;
      const offlineAssetsCount = brokenMachines + maintenanceMachines;

      res.json({
        success: true,
        data: {
          machineStatus,
          workOrderStatus: woStatus,
          overdueCount: overdueWOs.length,
          overdueWorkOrders: overdueWOs,
          totalWorkOrders: totalWO,
          newWorkRequestsCount,
          offlineAssetsCount,
        },
      });
    } catch (err) {
      console.error("Error in overview:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async workOrderOverdue(req, res) {
    try {
      const userDivisionId = req.user?.division_id;

      const overdueQuery = WorkOrder.query()
        .where("work_orders.status", "!=", "resolved")
        .where("scheduled_date", "<", new Date().toISOString().split("T")[0])
        .leftJoin("machines", "work_orders.machine_id", "machines.id")
        .withGraphFetched("[machine]");

      if (userDivisionId) {
        overdueQuery.where((builder) =>
          builder
            .where("machines.division_id", userDivisionId)
            .orWhereNull("machines.division_id")
        );
      }

      const overdueWOs = await overdueQuery;

      res.json({ success: true, data: overdueWOs });
    } catch (err) {
      console.error("Error in workOrderOverdue:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAllWorkOrders(req, res) {
    try {
      const userDivisionId = req.user?.division_id;

      const workOrdersQuery = WorkOrder.query()
        .leftJoin("machines", "work_orders.machine_id", "machines.id")
        .withGraphFetched("[machine, assignedTo]")
        .orderBy("work_orders.created_at", "desc");

      if (userDivisionId) {
        workOrdersQuery.where((builder) =>
          builder
            .where("machines.division_id", userDivisionId)
            .orWhereNull("machines.division_id")
        );
      }

      const workOrders = await workOrdersQuery;

      res.json({ success: true, data: workOrders });
    } catch (err) {
      console.error("Error in getAllWorkOrders:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMaintenanceSchedule(req, res) {
    try {
      const userDivisionId = req.user?.division_id;

      const scheduleQuery = WorkOrder.query()
        .whereNotNull("scheduled_date")
        .where("work_orders.status", "!=", "resolved")
        .leftJoin("machines", "work_orders.machine_id", "machines.id")
        .orderBy("scheduled_date", "asc")
        .withGraphFetched("machine")
        .select("work_orders.*");

      if (userDivisionId) {
        scheduleQuery.where((builder) =>
          builder
            .where("machines.division_id", userDivisionId)
            .orWhereNull("machines.division_id")
        );
      }

      const schedule = await scheduleQuery;

      const scheduleWithNotes = schedule.map((item) => ({
        ...item,
        notes: item.notes || item.description || "Scheduled maintenance",
      }));

      res.json({ success: true, data: scheduleWithNotes });
    } catch (err) {
      console.error("Error in getMaintenanceSchedule:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
