import { BaseModel } from './BaseModel.js';

export class Issue extends BaseModel {
  static get tableName() {
    return 'issues';
  }

  static get relationMappings() {
    return {
      machine: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: './Machine.js',
        join: {
          from: 'issues.machine_id',
          to: 'machines.id',
        },
      },
      reportedBy: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: './User.js',
        join: {
          from: 'issues.reported_by_id',
          to: 'users.id',
        },
      },
      workOrder: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: './WorkOrder.js',
        join: {
          from: 'issues.work_order_id',
          to: 'work_orders.id',
        },
      },
    };
  }
}
