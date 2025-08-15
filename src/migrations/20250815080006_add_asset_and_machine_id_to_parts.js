/**
 * Add asset_id and machine_id to parts table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.alterTable('parts', (table) => {
    table.string('asset_id', 36).nullable();
    table.string('machine_id', 36).nullable();
    table.foreign('asset_id').references('id').inTable('assets').onDelete('SET NULL');
    table.foreign('machine_id').references('id').inTable('machines').onDelete('SET NULL');
  });
};

export const down = function(knex) {
  return knex.schema.alterTable('parts', (table) => {
    try { table.dropForeign('asset_id'); } catch { /* ignore */ }
    try { table.dropForeign('machine_id'); } catch { /* ignore */ }
    try { table.dropColumn('asset_id'); } catch { /* ignore */ }
    try { table.dropColumn('machine_id'); } catch { /* ignore */ }
  });
};
