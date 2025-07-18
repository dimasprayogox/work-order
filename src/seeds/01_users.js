import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async function(knex) {
  await knex('users').del()

  const hashedPassword = await bcrypt.hash('password', 10);

  await knex("users").insert([
    {
      id: crypto.randomUUID(),
      username: "Technician",
      email: "technician@example.com",
      password: hashedPassword,
      role: "technician",
      full_name: "Mas Technician",
    },
    {
      id: crypto.randomUUID(),
      username: "Manager",
      email: "manager@example.com",
      password: hashedPassword,
      role: "manager",
      full_name: "Mas Manager",
    },
    {
      id: crypto.randomUUID(),
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      full_name: "Mas Admin",
    },
    {
      id: crypto.randomUUID(),
      username: "Logistics",
      email: "logistics@example.com",
      password: hashedPassword,
      role: "logistics",
      full_name: "Mas Logistics",
    },
    {
      id: crypto.randomUUID(),
      username: "Employee",
      email: "employee@example.com",
      password: hashedPassword,
      role: "employee",
      full_name: "Mas Employee",
    },
  ]);
};
