import bcrypt from "bcrypt";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async function(knex) {
  await knex('users').del()

  const hashedPassword = await bcrypt.hash('password', 10);

  await knex("users").insert([
    {
      username: "Technician",
      email: "technician@example.com",
      password: hashedPassword,
      role: "technician",
      full_name: "Mas Technician",
    },
    {
      username: "Manager",
      email: "manager@example.com",
      password: hashedPassword,
      role: "manager",
      full_name: "Mas Manager",
    },
    {
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      full_name: "Mas Admin",
    },
    {
      username: "Logistics",
      email: "logistics@example.com",
      password: hashedPassword,
      role: "logistics",
      full_name: "Mas Logistics",
    },
  ]);
};
