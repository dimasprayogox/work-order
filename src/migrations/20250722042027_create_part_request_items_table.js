/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable("part_request_items", (table) => {
    table.string("id", 36).primary();
    table.string("part_request_id", 36).notNullable();
    table.string("part_id", 36).notNullable();
    table.integer("quantity_requested").notNullable();
    table.integer("quantity_approved").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("part_request_id").references("id").inTable("part_requests").onDelete("CASCADE");
    table.foreign("part_id").references("id").inTable("parts").onDelete("RESTRICT");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("part_request_items");
};
