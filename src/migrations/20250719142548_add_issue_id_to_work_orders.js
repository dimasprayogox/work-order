exports.up = function (knex) {
    return knex.schema.alterTable('work_orders', function (table) {
        
        table.uuid('issue_id')
            .references('id').inTable('issues')
            .onDelete('SET NULL')
            .nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('work_orders', function (table) {
        table.dropForeign('issue_id');
        table.dropColumn('issue_id');
    });
};