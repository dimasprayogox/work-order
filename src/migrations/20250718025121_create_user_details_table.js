/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('user_details', (table) => {
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
     table.string("profile_photo_url", 255).nullable();
     table.string("phone_number", 20).nullable().unique();
     table.text("address").nullable();
     table.string("city", 100).nullable();
     table.string("country", 100).nullable();
     table.date("date_of_birth").nullable();
     table.text("bio").nullable();
     table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
     table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("user_details");
};
