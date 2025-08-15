/**
 * Add division_id column to users table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('division_id', 36).nullable();
    table.foreign('division_id').references('id').inTable('divisions').onDelete('SET NULL');
  });
};

export const down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    try { table.dropForeign('division_id'); } catch { /* ignore */ }
    try { table.dropColumn('division_id'); } catch { /* ignore */ }
  });
};
