/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
   return knex.schema.alterTable("users", (table) => {
     table.string("department", 100).notNullable();
     table.string("phone", 15).notNullable();
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
    return knex.schema.alterTable("users", (table) => {
        table.dropColumn("department");
        table.dropColumn("phone");
        table.dropColumn("is_active");
        table.dropColumn("created_at");
        table.dropColumn("updated_at");
    });
  
};
