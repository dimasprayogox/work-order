import { BaseModel } from './BaseModel.js';
import { Machine } from './Machine.js';
import { User } from './User.js';
import { Issue } from './Issue.js';

export class WorkOrder extends BaseModel {
    static get tableName() {
        return 'work_orders';
    }

    static get relationMappings() {
        return {
            machine: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Machine,
                join: {
                    from: 'work_orders.machine_id',
                    to: 'machines.id',
                },
            },
            assignedTo: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'work_orders.assigned_to_id',
                    to: 'users.id',
                },
            },
            createdBy: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'work_orders.created_by_id',
                    to: 'users.id',
                },
            },
            issue: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Issue,
                join: {
                    from: 'work_orders.issue_id',
                    to: 'issues.id',
                },
            },
        };
    }
}