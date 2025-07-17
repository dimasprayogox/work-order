/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async function(knex) {
  // Deletes ALL existing entries
  await knex("machines").del();
  const categories = await knex("machine_categories").select("id", "name");
  const cncCategory = categories.find((c) => c.name === "Mesin CNC");
  const pressCategory = categories.find((c) => c.name === "Mesin Press");

 
  await knex("machines").insert([
    {
      id: crypto.randomUUID(),
      machine_code: "CNC-001",
      name: "CNC Milling XYZ",
      category_id: cncCategory.id,
      location: "Gudang A, Sektor 1",
      status: "operational",
    },
    {
      id: crypto.randomUUID(),
      machine_code: "PRESS-H-05",
      name: "Hydraulic Press 5 Ton",
      category_id: pressCategory.id,
      location: "Area Produksi B",
      status: "maintenance",
    },
  ]);
};
