import { BaseModel } from './BaseModel.js';
import { MachineCategory } from './MachineCategory.js';
import { WorkOrder } from './WorkOrder.js';
import { Issue } from './Issue.js';
import { MaintenanceSchedule } from './MaintenanceSchedule.js';

export class Machine extends BaseModel {
    static get tableName() {
        return 'machines';
    }

    static get relationMappings() {
        return {
            
            category: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: MachineCategory,
                join: {
                    from: 'machines.category_id',
                    to: 'machine_categories.id',
                },
            },

            workOrders: {
                relation: BaseModel.HasManyRelation,
                modelClass: WorkOrder,
                join: {
                    from: 'machines.id',
                    to: 'work_orders.machine_id',
                },
            },

            issues: {
                relation: BaseModel.HasManyRelation,
                modelClass: Issue,
                join: {
                    from: 'machines.id',
                    to: 'issues.machine_id',
                },
            },

            schedules: {
                relation: BaseModel.HasManyRelation,
                modelClass: MaintenanceSchedule,
                join: {
                    from: 'machines.id',
                    to: 'maintenance_schedules.machine_id',
                },
            },
        };
    }
}
