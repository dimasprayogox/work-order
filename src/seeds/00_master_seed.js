import { seed as seedUsers } from "./01_users.js";
import { seed as seedCategories } from "./02_machine_categories.js";
import { seed as seedMachines } from "./03_machines.js";
import { seed as seedWorkOrders } from "./04_work_orders.js";
import { seed as seedSchedules } from "./05_maintenance_schedules.js";
import { seed as seedIssues } from "./06_issues.js";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  await seedUsers(knex);
  await seedCategories(knex);
  await seedMachines(knex);
  await seedWorkOrders(knex);
  await seedSchedules(knex);
  await seedIssues(knex);
};
