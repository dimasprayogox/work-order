
import { WorkOrder } from "../../models/WorkOrder.js";
import { Issue } from "../../models/Issue.js";
import { Part } from "../../models/Part.js";
import { db } from "../../core/config/knex.js";
import { User } from "../../models/User.js"; 

export const AdminDashboardController = {

  async overview(req, res) {
    try {
      const [
        keyMetrics,
        actionItems,
        chartData,
        users,
        highPriorityPendingWO,
      ] = await Promise.all([
        fetchKeyMetrics(),
        fetchActionItems(),
        fetchChartData(),
        User.query()
          .select(
            "users.id",
            "users.full_name",
            "users.email",
            "users.role",
            "users.division_id"
          )
          .withGraphFetched("division(selectName)")
          .modifiers({
            selectName(builder) {
              builder.select("id", "name");
            },
          }),
        WorkOrder.query()
          .where("priority", "high")
          .where("status", "pending")
          .withGraphFetched("[machine, asset, assignedTo]")
          .orderBy("scheduled_date", "asc"),
      ]);

      const formattedUsers = users.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        division_id: u.division_id,
        division_name: u.division?.name || null,
      }));

      res.json({
        success: true,
        data: {
          keyMetrics,
          actionItems,
          chartData,
          users: formattedUsers,
          highPriorityPendingWO,
        },
      });
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data dasbor",
        error: err.message,
      });
    }
  },
};

function calculateTrend(current, previous) {
  if (previous === 0) {
    return {
      trend: current > 0 ? "+100.0%" : "0.0%",
      isPositive: current > 0,
    };
  }
  const percentageChange = ((current - previous) / previous) * 100;
  return {
    trend: `${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(1)}%`,
    isPositive: percentageChange >= 0,
  };
}

async function fetchKeyMetrics() {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const yesterdayStart = new Date(new Date().setDate(todayStart.getDate() - 1));
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const [
    todayUnassignedWO,
    yesterdayUnassignedWO,
    todayInProgressWO,
    yesterdayInProgressWO,
    lowStockParts,
    allUsers,
  ] = await Promise.all([
    WorkOrder.query()
      .whereNull("assigned_to_id")
      .where("created_at", ">=", todayStart)
      .resultSize(),
    WorkOrder.query()
      .whereNull("assigned_to_id")
      .whereBetween("created_at", [yesterdayStart, yesterdayEnd])
      .resultSize(),

    WorkOrder.query()
      .where("status", "in_progress")
      .where("started_at", ">=", todayStart)
      .resultSize(),
    WorkOrder.query()
      .where("status", "in_progress")
      .whereBetween("started_at", [yesterdayStart, yesterdayEnd])
      .resultSize(),

    Part.query().whereRaw("quantity_in_stock <= min_stock").resultSize(),
    User.query().resultSize(),
  ]);

  const unassignedWorkOrders = {
    value: todayUnassignedWO,
    ...calculateTrend(todayUnassignedWO, yesterdayUnassignedWO),
  };
  const inProgressWorkOrders = {
    value: todayInProgressWO,
    ...calculateTrend(todayInProgressWO, yesterdayInProgressWO),
  };

  const lowStockPartsMetric = {
    value: lowStockParts,
    trend: "N/A",
    isPositive: true,
  };
  const allUsersMetric = { value: allUsers, trend: "N/A", isPositive: true };

  return {
    unassignedWorkOrders,
    inProgressWorkOrders,
    lowStockParts: lowStockPartsMetric, 
    allUsers: allUsersMetric, 
  };
}

async function fetchActionItems() {
  const [overdueWorkOrders] = await Promise.all([
    WorkOrder.query()
      .where("status", "!=", "completed")
      .where("scheduled_date", "<", new Date())
      .withGraphFetched("[assignedTo, machine, asset]")
      .orderBy("scheduled_date", "asc")
      .limit(5),
    Issue.query()
      .where("status", "open")
      .withGraphFetched("[machine, asset, reportedBy]")
      .orderBy("created_at", "desc")
      .limit(5),
  ]);

  return { overdueWorkOrders };
}

async function fetchChartData() {
  const [workOrderStatus, issueTypeDistribution, issueTrendsByMonth] =
    await Promise.all([
      WorkOrder.query()
        .groupBy("status")
        .select("status", db.raw("count(*) as count")),

      Issue.query()
        .select(
          db.raw(
            "CASE WHEN machine_id IS NOT NULL THEN 'machine' ELSE 'asset' END as type"
          ),
          db.raw("count(*) as count")
        )
        .groupBy("type"),

      // 3. Panggil fungsi helper untuk data tren
      fetchIssueTrendsByMonth(),
    ]);

  return { workOrderStatus, issueTypeDistribution, issueTrendsByMonth };
}


async function fetchIssueTrendsByMonth() {
  // Langkah 1: Query data dari database
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const dbResults = await Issue.query()
    .select(
      db.raw("EXTRACT(YEAR FROM created_at) as year"),
      db.raw("EXTRACT(MONTH FROM created_at) as month_num"),
      db.raw(
        "CAST(COUNT(CASE WHEN machine_id IS NOT NULL THEN 1 END) AS UNSIGNED) as machine"
      ),
      db.raw(
        "CAST(COUNT(CASE WHEN machine_id IS NULL THEN 1 END) AS UNSIGNED) as asset"
      )
    )
    .where("created_at", ">=", sixMonthsAgo)
    .groupBy("year", "month_num")
    .orderBy("year", "asc")
    .orderBy("month_num", "asc");

  const monthLabels = [];
  const monthShortNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthLabels.push({
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
      month: monthShortNames[d.getMonth()],
    });
  }

  const resultMap = new Map(
    dbResults.map((item) => [
      `${item.year}-${item.month_num}`,
      { machine: Number(item.machine), asset: Number(item.asset) }, 
    ])
  );

  const finalData = monthLabels.map((labelInfo) => {
    const data = resultMap.get(labelInfo.key) || { machine: 0, asset: 0 };
    return {
      month: labelInfo.month,
      machine: data.machine,
      asset: data.asset,
    };
  });

  return finalData;
}
