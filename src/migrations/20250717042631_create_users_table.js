/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
    return knex.schema.createTable('users', (table) => {
        table.string('id').primary();
        table.string('username', 50).notNullable();
        table.string('email', 100).notNullable().unique();
        table.string('password', 255).notNullable();
        table.string('full_name', 100).notNullable();
        table.enum('role', ['admin', 'employee', 'technician', 'manager', 'logistics']).notNullable().defaultTo('employee');
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("users");
};
