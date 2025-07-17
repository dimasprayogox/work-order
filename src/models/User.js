import { BaseModel } from './BaseModel.js';
import { WorkOrder } from './WorkOrder.js';
import { Issue } from './Issue.js';
import { MaintenanceSchedule } from './MaintenanceSchedule.js';

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
                modelClass: WorkOrder,
                join: {
                    from: 'users.id',
                    to: 'work_orders.created_by_id',
                },
            },

            assignedWorkOrders: {
                relation: BaseModel.HasManyRelation,
                modelClass: WorkOrder,
                join: {
                    from: 'users.id',
                    to: 'work_orders.assigned_to_id',
                },
            },

            reportedIssues: {
                relation: BaseModel.HasManyRelation,
                modelClass: Issue,
                join: {
                    from: 'users.id',
                    to: 'issues.reported_by_id',
                },
            },

            createdSchedules: {
                relation: BaseModel.HasManyRelation,
                modelClass: MaintenanceSchedule,
                join: {
                    from: 'users.id',
                    to: 'maintenance_schedules.created_by_id',
                },
            },
        };
    }
}
