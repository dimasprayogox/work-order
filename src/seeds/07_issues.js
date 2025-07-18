/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('issues').del()
 const machines = await knex("machines").select("id", "machine_code");
 const users = await knex("users").select("id", "username");
 const workOrders = await knex("work_orders").select("id", "title");

 const machineCnc = machines.find((m) => m.machine_code === "CNC-001");
 const userEmployee = users.find((u) => u.username === "Technician"); // Asumsikan teknisi juga employee
 const woCnc = workOrders.find((wo) => wo.title.includes("CNC-001"));


 await knex("issues").insert([
   {
     id: crypto.randomUUID(),
     machine_id: machineCnc.id,
     title: "Lampu Indikator Mati",
     description: "Lampu indikator power pada mesin CNC-001 tidak menyala.",
     reported_by_id: userEmployee.id,
     status: "in_progress",
     work_order_id: woCnc ? woCnc.id : null, // Hubungkan ke WO jika ada
   },
 ]);
};
