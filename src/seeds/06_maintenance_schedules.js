/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  await knex("maintenance_schedules").del();

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

  // Fungsi untuk format ke MySQL DATETIME: YYYY-MM-DD HH:mm:ss
  const formatDateForMySQL = (date) => {
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  await knex("maintenance_schedules").insert([
    {
      id: crypto.randomUUID(),
      machine_id: machinePress.id,
      title: "Pengecekan Oli Hidrolik Bulanan",
      description: "Ganti oli dan filter hidrolik sesuai standar.",
      frequency: "monthly",
<<<<<<< HEAD
      next_due_date: formatDateForMySQL(nextDueDate), // Sudah sesuai format MySQL
=======
      next_due_date: nextDueDate.toISOString().replace('T', ' ').replace(/\..+/, ''),
>>>>>>> 765c87f5d43a175aedb06261ffffa7fe0c9dd809
      created_by_id: userManager.id,
      is_active: true,
    },
  ]);

  console.log("Data maintenance_schedules berhasil di-seed.");
};
