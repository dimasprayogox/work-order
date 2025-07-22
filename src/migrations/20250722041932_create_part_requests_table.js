/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable("part_requests", (table) => {
    table.string("id", 36).primary();
    table.string("work_order_id", 36).notNullable();
    table.string("requested_by_id", 36).notNullable();
    table
      .enum("status", ["pending", "approved", "rejected", "fulfilled"])
      .notNullable()
      .defaultTo("pending");
    table.text("note").nullable();
    table.timestamps(true, true);

    table.foreign("work_order_id").references("id").inTable("work_orders").onDelete("CASCADE");
    table.foreign("requested_by_id").references("id").inTable("users").onDelete("RESTRICT");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("part_requests");
};
