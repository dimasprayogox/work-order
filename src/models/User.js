import { BaseModel } from './BaseModel.js';

export class User extends BaseModel {
  static get tableName() {
    return 'users';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      createdWorkOrders: {
        relation: BaseModel.HasManyRelation,
        modelClass: './WorkOrder.js',
        join: {
          from: 'users.id',
          to: 'work_orders.created_by_id',
        },
      },
      assignedWorkOrders: {
        relation: BaseModel.HasManyRelation,
        modelClass: './WorkOrder.js',
        join: {
          from: 'users.id',
          to: 'work_orders.assigned_to_id',
        },
      },
      reportedIssues: {
        relation: BaseModel.HasManyRelation,
        modelClass: './Issue.js',
        join: {
          from: 'users.id',
          to: 'issues.reported_by_id',
        },
      },
      createdSchedules: {
        relation: BaseModel.HasManyRelation,
        modelClass: './MaintenanceSchedule.js',
        join: {
          from: 'users.id',
          to: 'maintenance_schedules.created_by_id',
        },
      },
    };
  }
}
