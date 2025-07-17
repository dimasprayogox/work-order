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
      name: "Technician",
      email: "technician@example.com",
      password: hashedPassword,
      role: "technician",
      department: "Field Technician",
      phone: "1234567890",
    },
    {
      name: "Manager",
      email: "manager@example.com",
      password: hashedPassword,
      role: "manager",
      department: "Management",
      phone: "1234567890",
    },
    {
      name: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      department: "Administration",
      phone: "1234567890",
    },
    {
      name: "Logistics",
      email: "logistics@example.com",
      password: hashedPassword,
      role: "logistics",
      department: "Logistics & Warehouse",
      phone: "1234567890",
    },
  ]);
};
