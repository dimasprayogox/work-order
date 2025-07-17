/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable("projects", (table) => {
    table.bigIncrements("id").primary();
    table.string("name", 100).notNullable();
    table.string("code", 50).notNullable().unique();
    table.text("description");
    table
      .bigInteger("site_id")
      .unsigned()
      .references("id")
      .inTable("sites")
      .onDelete("CASCADE");
    table
      .bigInteger("manager_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table
      .enum("status", [
        "planning",
        "active",
        "completed",
        "cancelled",
        "on_hold",
      ])
      .defaultTo("planning");
    table.timestamp("start_date");
    table.timestamp("end_date");
    table.decimal("budget", 15, 2);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.dropTableIfExists("projects", (table) => {
    table.dropColumn("site_id");
    table.dropColumn("manager_id");
  });
};
