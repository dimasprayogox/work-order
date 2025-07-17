/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable("issues", (table) => {
    table.string("id", 36).primary();
    table.string("title", 200).notNullable();
    table.text("description").notNullable();
    table
      .enum("status", ["open", "in_progress", "resolved"])
      .notNullable()
      .defaultTo("open");
    table.string("photo_url", 500).nullable();

    // Foreign Keys
    table.string("machine_id", 36).notNullable();
    table
      .foreign("machine_id")
      .references("id")
      .inTable("machines")
      .onDelete("CASCADE");

    table.string("reported_by_id", 36).notNullable();
    table
      .foreign("reported_by_id")
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");

    table.string("work_order_id", 36).nullable();
    table
      .foreign("work_order_id")
      .references("id")
      .inTable("work_orders")
      .onDelete("SET NULL");

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("issues");
};
