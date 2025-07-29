/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.table('maintenance_schedules', function (table) {
        table.enum("priority", ["low", "medium", "high"]).notNullable().defaultTo("medium");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.table('maintenance_schedules', function (table) {
        table.dropColumn('priority');
    });
};