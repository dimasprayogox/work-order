/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.alterTable("part_usages", (table) => {
    table.string("part_request_item_id", 36).nullable();

    table.foreign("part_request_item_id")
         .references("id")
         .inTable("part_request_items")
         .onDelete("SET NULL");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.alterTable("part_usages", (table) => {
    table.dropForeign("part_request_item_id");
    table.dropColumn("part_request_item_id");
  });
};