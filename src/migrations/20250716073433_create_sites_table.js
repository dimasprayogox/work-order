/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
   return knex.schema.createTable("sites", (table) => {
      table.bigIncrements("id").primary();
      table.string("name", 100).notNullable();
      table.string("code", 50).notNullable().unique();
      table.text("address");
      table.string("city", 100);
      table.string("province", 100);
      table.string("postal_code", 10);
      table
        .bigInteger("manager_id")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
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
    return knex.schema.dropTableIfExists("sites", (table) => {
      table.dropColumn("manager_id");
    });
};

