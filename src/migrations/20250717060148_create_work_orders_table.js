/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable("work_orders", (table) => {
    table.string("id", 36).primary();
    table.string("title", 200).notNullable();
    table.text("description").nullable();
    table
      .enum("priority", ["low", "medium", "high"])
      .notNullable()
      .defaultTo("medium");
    table
      .enum("status", ["pending", "in_progress", "completed"])
      .notNullable()
      .defaultTo("pending");
    table.timestamp("scheduled_date").nullable();
    table.timestamp("started_at").nullable();
    table.timestamp("completed_at").nullable();
    table.text("notes").nullable();

    // Foreign Keys
    table.string("machine_id", 36).notNullable();
    table
      .foreign("machine_id")
      .references("id")
      .inTable("machines")
      .onDelete("CASCADE"); // Jika mesin dihapus, WO ikut terhapus

    table.string("assigned_to_id", 36).nullable();
    table
      .foreign("assigned_to_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL"); // Jika teknisi dihapus, WO tidak terhapus

    table.string("created_by_id", 36).notNullable();
    table
      .foreign("created_by_id")
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT"); // Jangan hapus user jika masih punya WO

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists("work_orders");
};
