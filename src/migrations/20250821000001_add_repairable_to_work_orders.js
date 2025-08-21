export const up = function(knex) {
  return knex.schema.alterTable('work_orders', (table) => {
    // nullable boolean: true => repairable, false => not repairable
    table.boolean('repairable').nullable().defaultTo(null);
  });
};

export const down = function(knex) {
  return knex.schema.alterTable('work_orders', (table) => {
    table.dropColumn('repairable');
  });
};
