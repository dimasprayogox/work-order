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

    table.string("machine_id", 36).notNullable();
    table
      .foreign("machine_id")
      .references("id")
      .inTable("machines")
      .onDelete("CASCADE");

    table.string("assigned_to_id", 36).nullable();
    table
      .foreign("assigned_to_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table.string("created_by_id", 36).notNullable();
    table
      .foreign("created_by_id")
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");

    table.timestamps(true, true);
  });
};

export const down = function(knex) {
  return knex.schema.dropTableIfExists("work_orders");
};