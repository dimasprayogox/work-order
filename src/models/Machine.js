import { BaseModel } from './BaseModel.js';

export class Machine extends BaseModel {
  static get tableName() {
    return 'machines';
  }

  static get relationMappings() {
    return {
      category: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: './MachineCategory.js',
        join: {
          from: 'machines.category_id',
          to: 'machine_categories.id',
        },
      },
      workOrders: {
        relation: BaseModel.HasManyRelation,
        modelClass: './WorkOrder.js',
        join: {
          from: 'machines.id',
          to: 'work_orders.machine_id',
        },
      },
      issues: {
        relation: BaseModel.HasManyRelation,
        modelClass: './Issue.js',
        join: {
          from: 'machines.id',
          to: 'issues.machine_id',
        },
      },
      schedules: {
        relation: BaseModel.HasManyRelation,
        modelClass: './MaintenanceSchedule.js',
        join: {
          from: 'machines.id',
          to: 'maintenance_schedules.machine_id',
        },
      },
    };
  }
}
