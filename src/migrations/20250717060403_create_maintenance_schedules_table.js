/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable("maintenance_schedules", (table) => {
    table.string("id", 36).primary();
    table.string("title", 200).notNullable();
    table.text("description").nullable();
    table.enum("frequency", ["daily", "weekly", "monthly"]).notNullable();
    table.timestamp("next_due_date").notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);

    // Foreign Keys
    table.string("machine_id", 36).notNullable();
    table
      .foreign("machine_id")
      .references("id")
      .inTable("machines")
      .onDelete("CASCADE");

    table.string("created_by_id", 36).notNullable();
    table
      .foreign("created_by_id")
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("maintenance_schedules");
};
