import { seed as seedUsers } from "./01_users.js";
import { seed as seedUserDetails } from "./02_user_details.js";
import { seed as seedCategories } from "./03_machine_categories.js";
import { seed as seedMachines } from "./04_machines.js";
import { seed as seedWorkOrders } from "./05_work_orders.js";
import { seed as seedSchedules } from "./06_maintenance_schedules.js";
import { seed as seedIssues } from "./07_issues.js";
import { seed as seedParts } from "./08_parts_seed.js";
import { seed as seedPartRequests } from "./09_part_requests_seed.js";
import { seed as seedPartRequestItems } from "./10_part_request_items_seed.js";
import { seed as seedPartUsages } from "./11_part_usages_seed.js";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Urutkan dari tabel anak ke induk
  const tables = [
    "part_usages",
    "part_request_items",
    "part_requests",
    "parts",
    "issues",
    "maintenance_schedules",
    "work_orders",
    "machines",
    "machine_categories",
    "user_details",
    "users",
  ];

  console.log("Menghapus semua data dari database...");

  // Nonaktifkan FK agar bisa truncate dengan aman
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of tables) {
    await knex(table).truncate();
    console.log(`Tabel ${table} berhasil dikosongkan.`);
  }
  await knex.raw("SET FOREIGN_KEY_CHECKS = 1");

  console.log("Semua data berhasil dihapus. Memulai proses seeding...");

  // Seed urut dari tabel induk ke anak
  await seedUsers(knex);
  await seedUserDetails(knex);
  await seedCategories(knex);
  await seedMachines(knex);
  await seedIssues(knex);            // Issues butuh users dan machines
  await seedWorkOrders(knex);        // Work orders butuh users dan machines
  await seedSchedules(knex);
  await seedParts(knex);
  await seedPartRequests(knex);      // Part requests butuh users dan work orders
  await seedPartRequestItems(knex);  // Items butuh part requests dan parts
  await seedPartUsages(knex);        // Usages butuh work orders, parts, dan users

  console.log("Proses seeding selesai.");
};