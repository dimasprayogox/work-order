// src/seeds/11_part_usages.js
import crypto from "crypto";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Bersihkan dulu tabel
  await knex("part_usages").del();
  console.log("Tabel part_usages berhasil dikosongkan.");

  const parts = await knex("parts").select("id");
  const workOrders = await knex("work_orders").select("id");
  const users = await knex("users").select("id", "username");
  const partRequestItems = await knex("part_request_items").select("id");

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
  const firstRequestItem = partRequestItems[0] || null; // opsional

  await knex("part_usages").insert([
    {
      id: crypto.randomUUID(),
      work_order_id: firstWO.id,
      part_id: firstPart.id,
      used_by_id: technician.id,
      part_request_item_id: firstRequestItem ? firstRequestItem.id : null,
      quantity_used: 2,
      created_at: new Date(),
    },
  ]);

  console.log("Data part_usages berhasil di-seed.");
}
