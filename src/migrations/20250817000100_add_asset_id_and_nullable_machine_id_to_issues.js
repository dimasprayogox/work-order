/**
 * Add asset_id column and make machine_id nullable for issues and work_orders tables
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .alterTable('issues', (table) => {
      // Drop existing foreign key constraint for machine_id
      table.dropForeign('machine_id');
      // Alter machine_id to be nullable
      table.string('machine_id', 36).nullable().alter();
      // Add asset_id column
      table.string('asset_id', 36).nullable();
      
      // Re-add foreign key constraints
      table.foreign('machine_id').references('id').inTable('machines').onDelete('SET NULL');
      table.foreign('asset_id').references('id').inTable('assets').onDelete('SET NULL');
    })
    .then(() => {
      return knex.schema.alterTable('work_orders', (table) => {
        // Drop existing foreign key constraint for machine_id
        table.dropForeign('machine_id');
        // Alter machine_id to be nullable
        table.string('machine_id', 36).nullable().alter();
        // Add asset_id column
        table.string('asset_id', 36).nullable();
        
        // Re-add foreign key constraints
        table.foreign('machine_id').references('id').inTable('machines').onDelete('SET NULL');
        table.foreign('asset_id').references('id').inTable('assets').onDelete('SET NULL');
      });
    });
};

export const down = function(knex) {
  return knex.schema
    .alterTable('issues', (table) => {
      // Drop foreign key constraints
      try { table.dropForeign('machine_id'); } catch { /* ignore */ }
      try { table.dropForeign('asset_id'); } catch { /* ignore */ }
      // Drop asset_id column
      try { table.dropColumn('asset_id'); } catch { /* ignore */ }
      // Make machine_id not nullable again
      table.string('machine_id', 36).notNullable().alter();
      // Re-add machine_id foreign key
      table.foreign('machine_id').references('id').inTable('machines').onDelete('CASCADE');
    })
    .then(() => {
      return knex.schema.alterTable('work_orders', (table) => {
        // Drop foreign key constraints
        try { table.dropForeign('machine_id'); } catch { /* ignore */ }
        try { table.dropForeign('asset_id'); } catch { /* ignore */ }
        // Drop asset_id column
        try { table.dropColumn('asset_id'); } catch { /* ignore */ }
        // Make machine_id not nullable again
        table.string('machine_id', 36).notNullable().alter();
        // Re-add machine_id foreign key
        table.foreign('machine_id').references('id').inTable('machines').onDelete('CASCADE');
      });
    });
};