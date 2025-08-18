/**
 * Add type and asset_id columns to maintenance_schedules table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.alterTable('maintenance_schedules', (table) => {
    // Add type column
    table.enum('type', ['machine', 'asset']).defaultTo('machine');
    
    // Add asset_id column
    table.string('asset_id', 36).nullable();
    
    // Make machine_id nullable since now we can have asset schedules
    table.dropForeign('machine_id');
    table.string('machine_id', 36).nullable().alter();
    
    // Add foreign key constraints
    table.foreign('machine_id').references('id').inTable('machines').onDelete('SET NULL');
    table.foreign('asset_id').references('id').inTable('assets').onDelete('SET NULL');
  });
};

export const down = function(knex) {
  return knex.schema.alterTable('maintenance_schedules', (table) => {
    // Drop foreign key constraints
    try { table.dropForeign('machine_id'); } catch { /* ignore */ }
    try { table.dropForeign('asset_id'); } catch { /* ignore */ }
    
    // Drop asset_id column
    try { table.dropColumn('asset_id'); } catch { /* ignore */ }
    
    // Drop type column
    try { table.dropColumn('type'); } catch { /* ignore */ }
    
    // Make machine_id not nullable again
    table.string('machine_id', 36).notNullable().alter();
    
    // Re-add machine_id foreign key
    table.foreign('machine_id').references('id').inTable('machines').onDelete('CASCADE');
  });
};
