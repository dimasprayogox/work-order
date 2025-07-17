import path from 'path';
import { fileURLToPath } from 'url';
import { BaseModel } from './BaseModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Machine extends BaseModel {
  static get tableName() {
    return 'machines';
  }

  static get relationMappings() {
    return {
      category: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'MachineCategory.js'),
        join: {
          from: 'machines.category_id',
          to: 'machine_categories.id',
        },
      },
      workOrders: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'WorkOrder.js'),
        join: {
          from: 'machines.id',
          to: 'work_orders.machine_id',
        },
      },
      issues: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'Issue.js'),
        join: {
          from: 'machines.id',
          to: 'issues.machine_id',
        },
      },
      schedules: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'MaintenanceSchedule.js'),
        join: {
          from: 'machines.id',
          to: 'maintenance_schedules.machine_id',
        },
      },
    };
  }
}