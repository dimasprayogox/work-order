/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTableIfNotExists("work_request_assets", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("work_request_id").unsigned().notNullable().references("id").inTable("work_requests").onDelete("CASCADE");
    table.string("file_name", 255).notNullable();
    table.string("file_path", 255).notNullable();
    table.string("file_type", 100).notNullable();
    table.bigInteger("file_size").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("work_request_assets");
};
