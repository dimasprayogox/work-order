// src/seeds/11_part_usages.js
import crypto from "crypto";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const parts = await knex("parts").select("id");
  const workOrders = await knex("work_orders").select("id", "title");
  const users = await knex("users").select("id", "username");
  const technician = users.find((u) => u.username.toLowerCase() === "technician");

  if (parts.length === 0) {
    console.warn("Tidak ada parts, Part Usage tidak dibuat.");
    return;
  }
  if (workOrders.length === 0) {
    console.warn("Tidak ada Work Order, Part Usage tidak dibuat.");
    return;
  }
  if (!technician) {
    console.warn("Tidak ada user 'technician', Part Usage tidak dibuat.");
    return;
  }

  const firstPart = parts[0];
  const firstWO = workOrders[0];

  await knex("part_usages").insert([
    {
      id: crypto.randomUUID(),
      work_order_id: firstWO.id,
      part_id: firstPart.id,
      used_by_id: technician.id,
      quantity_used: 2,
      created_at: new Date(),
    },
  ]);

  console.log("Data part_usages berhasil di-seed.");
}
