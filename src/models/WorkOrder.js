import { BaseModel } from './BaseModel.js';

export class WorkOrder extends BaseModel {
  static get tableName() {
    return 'work_orders';
  }

  static get relationMappings() {
    return {
      machine: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: './Machine.js',
        join: {
          from: 'work_orders.machine_id',
          to: 'machines.id',
        },
      },
      assignedTo: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: './User.js',
        join: {
          from: 'work_orders.assigned_to_id',
          to: 'users.id',
        },
      },
      createdBy: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: './User.js',
        join: {
          from: 'work_orders.created_by_id',
          to: 'users.id',
        },
      },
      issues: {
        relation: BaseModel.HasManyRelation,
        modelClass: './Issue.js',
        join: {
          from: 'work_orders.id',
          to: 'issues.work_order_id',
        },
      },
    };
  }
}
