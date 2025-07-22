/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable("part_usages", (table) => {
    table.string("id", 36).primary();
    table.string("work_order_id", 36).notNullable();
    table.string("part_id", 36).notNullable();
    table.string("used_by_id", 36).notNullable();
    table.integer("quantity_used").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("work_order_id").references("id").inTable("work_orders").onDelete("CASCADE");
    table.foreign("part_id").references("id").inTable("parts").onDelete("RESTRICT");
    table.foreign("used_by_id").references("id").inTable("users").onDelete("RESTRICT");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("part_usages");
};
