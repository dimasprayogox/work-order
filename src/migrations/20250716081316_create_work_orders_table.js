/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable("work_orders", (table) => {
    table.bigIncrements("id").primary();
    table.string("code", 50).notNullable().unique();
    table
      .integer("work_request_id")
      .unsigned()
      .references("id")
      .inTable("work_requests")
      .onDelete("CASCADE");
    table
      .enum("status", [
        "open",
        "in_progress",
        "completed",
        "cancelled",
        "on_hold",
      ])
      .defaultTo("in_progress");
    table
      .enum("maintenance_type", [
        "maintenance",
        "repair",
        "inspection",
        "installation",
      ])
      .notNullable();
    table
      .enum("priority", ["low", "medium", "high", "critical"])
      .defaultTo("medium");
    table
      .integet("asset_id")
      .unsigned()
      .references("id")
      .inTable("assets")
      .onDelete("SET NULL");
    table
      .integer("project_id")
      .unsigned()
      .references("id")
      .inTable("projects")
      .onDelete("SET NULL");
    table.date("suggested_strt_date");
    table.date("suggested_completion_date");
    table.datetime("actual_start_date");
    table.datetime("actual_completion_date");
    table.text("summary_of_issue");
    table.integer("problem_code_id").unsigned().references("id").inTable("problem_codes").onDelete("SET NULL");
    table.text("work_instructions");
    table.integer("assigned_to_user_id").unsigned().references("id").inTable("users").onDelete("SET NULL");
    table.decimal("estimated_labor_hours", 8, 2);
    table.integer("completed_by_user_id").unsigned().references("id").inTable("users").onDelete("SET NULL");
    table.decimal("actual_labor_hours", 8, 2);
    table.dateTime("date_completed");
    table.decimal("total_cost", 15, 2);
    table.integer("created_by_user_id").unsigned().references("id").inTable("users").onDelete("SET NULL");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTableIfExists("work_orders");
};
