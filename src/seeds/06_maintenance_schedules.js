/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async function(knex) {
  await knex('maintenance_schedules').del();
  const machines = await knex("machines").select("id", "machine_code");
  const users = await knex("users").select("id", "username");

  const machinePress = machines.find((m) => m.machine_code === "PRESS-H-05");
  const userManager = users.find((u) => u.username === "Manager");

  if (!machinePress) {
      console.warn("Peringatan: Mesin 'PRESS-H-05' tidak ditemukan di seeder maintenance_schedules.");
      return; 
  }
  if (!userManager) {
      console.warn("Peringatan: User 'Manager' tidak ditemukan di seeder maintenance_schedules.");
      return; 
  }

  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  await knex("maintenance_schedules").insert([
    {
      id: crypto.randomUUID(),
      machine_id: machinePress.id,
      title: "Pengecekan Oli Hidrolik Bulanan",
      description: "Ganti oli dan filter hidrolik sesuai standar.",
      frequency: "monthly",
      next_due_date: nextDueDate.toISOString().replace('T', ' ').replace(/\..+/, ''),
      created_by_id: userManager.id,
      is_active: true,
    },
  ]);
  console.log('Data maintenance_schedules berhasil di-seed.');
};