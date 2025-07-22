import crypto from "crypto";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Hapus semua data lama
  await knex("parts").del();

  await knex("parts").insert([
    {
      id: crypto.randomUUID(),
      name: "Bearing 6203",
      part_number: "BRG-6203",
      description: "Bearing untuk motor listrik",
      quantity_in_stock: 50,
      min_stock: 10,
      location: "Rack A1",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: "Belt V-Type B38",
      part_number: "BLT-B38",
      description: "Belt untuk conveyor",
      quantity_in_stock: 20,
      min_stock: 5,
      location: "Rack B3",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};
