/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTableIfNotExists("users", (table) => {
    table.bigIncrements("id").primary();
    table.string("name", 100).notNullable();
    table.string("email", 100).notNullable().unique();
    table.string("password").notNullable();
    table
      .enu("role", ["technician", "manager", "admin", "logistics"])
      .notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.dropTableIfExists("users");
};
