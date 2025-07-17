/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTableIfNotExists("work_requests", (table) => {
    table.bigIncrements("id").primary();
    table.string("number", 50).notNullable();
    table.integer("site_id").unsigned().references("id").inTable("sites").onDelete("SET NULL").notNullable();
    table.text("description").notNullable();
    table.int("requester_id").unsigned().references("id").inTable("users").onDelete("SET NULL").notNullable();
    table.enum("status", ["pending", "approved", "rejected", "converted_to_wo"]).defaultTo("pending");
    table.enum("priority", ["low", "medium", "high", "critical"]).defaultTo("medium");
    table.datetime("request_date").defaultTo(knex.fn.now());
    table.integer("approved_by_user_id").unsigned().references("id").inTable("users").onDelete("SET NULL");
    table.datetime("approved_date");
    table.text("rejection_reason");
    table.integer("work_order_id").unsigned().references("id").inTable("work_orders").onDelete("SET NULL");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  
};
