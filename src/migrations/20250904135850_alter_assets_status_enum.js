/**
 * Alter assets table to remove 'inactive' status from enum
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // First, update any existing 'inactive' records to 'operational' to preserve data
  await knex('assets')
    .where('status', 'inactive')
    .update({ status: 'operational' });

  // For MySQL/PostgreSQL, we need to drop and recreate the column with new enum values
  await knex.schema.alterTable('assets', (table) => {
    table.dropColumn('status');
  });

  await knex.schema.alterTable('assets', (table) => {
    table.enum('status', ['operational', 'maintenance', 'down']).nullable().defaultTo('operational');
  });
};

/**
 * Rollback - restore the original enum with 'inactive' status
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  await knex.schema.alterTable('assets', (table) => {
    table.dropColumn('status');
  });

  await knex.schema.alterTable('assets', (table) => {
    table.enum('status', ['operational', 'maintenance', 'down', 'inactive']).nullable().defaultTo('operational');
  });
};
