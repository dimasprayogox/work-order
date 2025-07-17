/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable("machine_categories", (table) => {
    table.string("id", 36).primary();
    table.string("name", 100).notNullable();
    table.text("description").nullable();
    // ERD hanya punya created_at, tapi timestamps(true,true) lebih baik
    // karena juga membuat updated_at secara otomatis.
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("machine_categories");
};
