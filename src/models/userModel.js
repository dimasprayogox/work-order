import { db } from "../core/config/knex.js";

/**
 * Get all users
 **/
export const getAllUsers = async () => db("users").select("*");

/**
 * Get user by ID
 **/
export const getUserById = async (id) => db("users").where({ id }).first();

/**
 * Get user by email
 **/
export const getUserByEmail = async (email) =>
  db("users").where({ email }).first();

/**
 * Create new user
 **/
export const addUser = async ({ name, email, password, role = "user" }) => {
  const [id] = await db("users").insert({ name, email, password, role });
  return db("users").where({ id }).first();
};

// get user with detail by id
export const getUserWithDetailById = async (id) =>
  db("users")
    .leftJoin("user_details", "users.id", "user_details.user_id")
    .where("users.id", id)
    .select("users.*", "user_details.*")
    .first();
