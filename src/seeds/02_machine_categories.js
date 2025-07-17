/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async function(knex) {
  // Deletes ALL existing entries
  await knex("machine_categories").del();

  // add new machine categories
  await knex("machine_categories").insert([
    {
      id: crypto.randomUUID(),
      name: "Mesin Press",
      description: "Kategori untuk semua jenis mesin press hidrolik.",
    },
    {
      id: crypto.randomUUID(),
      name: "Mesin CNC",
      description: "Kategori untuk mesin Computer Numerical Control.",
    },
    {
      id: crypto.randomUUID(),
      name: "Conveyor Belt",
      description: "Kategori untuk sistem ban berjalan.",
    },
  ]);
};
