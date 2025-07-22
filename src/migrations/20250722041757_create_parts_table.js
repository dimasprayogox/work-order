/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable("parts", (table) => {
    table.string("id", 36).primary();
    table.string("name", 100).notNullable();
    table.string("part_number", 100).notNullable().unique();
    table.text("description").nullable();
    table.integer("quantity_in_stock").notNullable().defaultTo(0);
    table.integer("min_stock").notNullable().defaultTo(0);
    table.string("location", 100).nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("parts");
};
