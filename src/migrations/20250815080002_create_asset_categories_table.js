/**
 * Create asset_categories table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('asset_categories', (table) => {
    table.string('id', 36).primary();
  table.string('name', 100).nullable();
  table.text('description').nullable();
  table.timestamp('created_at').nullable();
  table.timestamp('updated_at').nullable();
  });
};

export const down = function(knex) {
  return knex.schema.dropTableIfExists('asset_categories');
};
