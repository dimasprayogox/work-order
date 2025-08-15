/**
 * Create assets table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('assets', (table) => {
    table.string('id', 36).primary();
  table.string('asset_code', 100).nullable().unique();
  table.string('name', 100).nullable();
  table.string('location', 100).nullable();
  table.enum('status', ['operational', 'maintenance', 'down', 'inactive']).nullable().defaultTo('operational');
    table.string('category_id', 36).nullable();
    table.string('division_id', 36).nullable();
  table.string('type', 50).nullable();
  table.timestamp('created_at').nullable();
  table.timestamp('updated_at').nullable();

    table.foreign('category_id').references('id').inTable('asset_categories').onDelete('SET NULL');
    table.foreign('division_id').references('id').inTable('divisions').onDelete('SET NULL');
  });
};

export const down = function(knex) {
  return knex.schema.dropTableIfExists('assets');
};
