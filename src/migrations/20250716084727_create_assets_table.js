/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTableIfNotExists("work_requests", (table) => {
    table.bigIncrements("id").primary();
    table.string("name", 100).notNullable();
    table.string("code", 50).notNullable().unique();
    table.string("asset_type", 100);
    table.string("model", 100);
    table.string("serial_number", 100);
    table.string("location", 255);
    table.integer("site_id").unsigned().references("id").inTable("sites").onDelete("SET NULL").notNullable();
    table.date("purchase_date");
    table.date("warranty_expiry");
    table.enum("status", ["active", "inactive", "maintenance", "retired"]).defaultTo("active");
    table.dateTime("created_at").defaultTo(knex.fn.now());
    table.dateTime("updated_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  
};
