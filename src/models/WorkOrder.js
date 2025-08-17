import { BaseModel } from './BaseModel.js';
import { Machine } from './Machine.js';
import { Asset } from './Asset.js';
import { User } from './User.js';
import { Issue } from './Issue.js';
import { PartRequest } from './PartRequest.js';
import { Model } from 'objection';

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
            asset: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Asset,
                join: {
                    from: 'work_orders.asset_id',
                    to: 'assets.id',
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
            partRequests: {
                relation: Model.HasManyRelation,
                modelClass: PartRequest,
                join: {
                    from: 'work_orders.id',
                    to: 'part_requests.work_order_id',
                },
            },
        };
    }
}
