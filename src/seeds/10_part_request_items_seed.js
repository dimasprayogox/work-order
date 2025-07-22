import crypto from "crypto";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Hapus semua data lama
  await knex("part_request_items").del();

  const partRequests = await knex("part_requests").select("id").limit(1);
  const parts = await knex("parts").select("id", "part_number");

  const partRequest = partRequests[0];
  const bearing = parts.find((p) => p.part_number === "BRG-6203");
  const belt = parts.find((p) => p.part_number === "BLT-B38");

  if (!partRequest || !bearing || !belt) return;

  await knex("part_request_items").insert([
    {
      id: crypto.randomUUID(),
      part_request_id: partRequest.id,
      part_id: bearing.id,
      quantity_requested: 2,
      quantity_approved: null,
      created_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      part_request_id: partRequest.id,
      part_id: belt.id,
      quantity_requested: 1,
      quantity_approved: null,
      created_at: new Date(),
    },
  ]);
};
