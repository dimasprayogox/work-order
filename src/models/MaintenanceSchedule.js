import { BaseModel } from './BaseModel.js';

export class MaintenanceSchedule extends BaseModel {
  static get tableName() {
    return 'maintenance_schedules';
  }

  static get relationMappings() {
    return {
      machine: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: './Machine.js',
        join: {
          from: 'maintenance_schedules.machine_id',
          to: 'machines.id',
        },
      },
      createdBy: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: './User.js',
        join: {
          from: 'maintenance_schedules.created_by_id',
          to: 'users.id',
        },
      },
    };
  }
}
