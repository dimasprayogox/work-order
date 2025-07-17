/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTableIfNotExists("problem_codes", (table) => {
    table.bigIncrements("id").primary();
    table.string("codes", 50).notNullable().unique();
    table.string("description", 255).notNullable();
    table.string("category", 100);
    table.enum("severity", ["low", "medium", "high", "critical"]);
    table.boolean("is_active").defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
    return knex.schema.dropTableIfExists("problem_codes");
  
};
