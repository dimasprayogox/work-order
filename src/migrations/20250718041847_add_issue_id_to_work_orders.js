/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function (knex) {
    await knex.schema.alterTable("work_orders", (table) => {
        table.string("issue_id", 36).nullable();

        table
            .foreign("issue_id")
            .references("id")
            .inTable("issues")
            .onDelete("SET NULL"); // jika issue dihapus, WO tetap ada tapi issue_id jadi NULL
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function (knex) {
    await knex.schema.alterTable("work_orders", (table) => {
        table.dropForeign(["issue_id"]);
        table.dropColumn("issue_id");
    });
};
