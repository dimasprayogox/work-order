/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('work_orders').del()
  const machines = await knex("machines").select("id", "machine_code");
  const users = await knex("users").select("id", "username");

  const machineCnc = machines.find((m) => m.machine_code === "CNC-001");
  const userAdmin = users.find((u) => u.username === "admin");
  const userTechnician = users.find((u) => u.username === "Technician");


  await knex("work_orders").insert([
    {
      id: crypto.randomUUID(),
      title: "Perbaikan Spindle Mesin CNC-001",
      description: "Spindle mengeluarkan suara aneh, perlu diperiksa.",
      machine_id: machineCnc.id,
      assigned_to_id: userTechnician.id,
      created_by_id: userAdmin.id,
      priority: "high",
      status: "in_progress",
      scheduled_date: new Date(),
    },
  ]);
};
