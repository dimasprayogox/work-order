import crypto from "crypto";

export const seed = async function (knex) {
  const users = await knex("users").select("id", "username");
  const technician = users.find((u) => u.username.toLowerCase() === "technician");

  const workOrders = await knex("work_orders").select("id");
  const firstWO = workOrders[0];

  if (!technician || !firstWO) {
    console.warn("Tidak bisa membuat Part Requests: user atau work order tidak ditemukan.");
    return;
  }

  await knex("part_requests").insert([
    {
      id: crypto.randomUUID(),
      work_order_id: firstWO.id,
      requested_by_id: technician.id,
      status: "pending",
      note: "Permintaan part untuk perbaikan mesin CNC.",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};
