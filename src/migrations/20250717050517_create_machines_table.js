/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable("machines", (table) => {
    table.string("id", 36).primary();
    table.string("machine_code", 20).notNullable().unique();
    table.string("name", 100).notNullable();
    table.string("location", 100).notNullable();
    table
      .enum("status", ["operational", "maintenance", "down"])
      .notNullable()
      .defaultTo("operational");

    // Foreign Key untuk category_id
    table.string("category_id", 36).nullable();
    table
      .foreign("category_id")
      .references("id")
      .inTable("machine_categories")
      .onDelete("SET NULL"); // Jika kategori dihapus, set ID kategori di mesin menjadi NULL

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("machines");
};
