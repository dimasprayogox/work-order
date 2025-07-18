import { seed as seedUsers } from "./01_users.js";
import { seed as seedUserDetails } from "./02_user_details.js";
import { seed as seedCategories } from "./03_machine_categories.js";
import { seed as seedMachines } from "./04_machines.js";
import { seed as seedWorkOrders } from "./05_work_orders.js";
import { seed as seedSchedules } from "./06_maintenance_schedules.js";
import { seed as seedIssues } from "./07_issues.js";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  const tables = [
    "issues",
    "maintenance_schedules",
    "work_orders",
    "user_details",
    "machines",
    "machine_categories",
    "users",
  ];

  console.log("Menghapus semua data dari database...");

  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");

  for (const table of tables) {
    await knex(table).truncate();
    console.log(`Tabel ${table} berhasil dikosongkan.`);
  }

  await knex.raw("SET FOREIGN_KEY_CHECKS = 1");

  console.log("Semua data berhasil dihapus. Memulai proses seeding...");

  await seedUsers(knex);
  await seedUserDetails(knex);
  await seedCategories(knex);
  await seedMachines(knex);
  await seedWorkOrders(knex);
  await seedSchedules(knex);
  await seedIssues(knex);

  console.log("Proses seeding selesai.");
};
