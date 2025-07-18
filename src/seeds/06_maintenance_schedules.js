/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('maintenance_schedules').del()
  const machines = await knex("machines").select("id", "machine_code");
  const users = await knex("users").select("id", "username");

  const machinePress = machines.find((m) => m.machine_code === "PRESS-H-05");
  const userManager = users.find((u) => u.username === "Manager");

  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  await knex("maintenance_schedules").insert([
    {
      id: crypto.randomUUID(),
      machine_id: machinePress.id,
      title: "Pengecekan Oli Hidrolik Bulanan",
      description: "Ganti oli dan filter hidrolik sesuai standar.",
      frequency: "monthly",
      next_due_date: nextDueDate,
      created_by_id: userManager.id,
      is_active: true,
    },
  ]);
};
