import { BaseModel } from './BaseModel.js';
import { Machine } from './Machine.js';
import { Asset } from './Asset.js';
import { User } from './User.js';
import { WorkOrder } from './WorkOrder.js';

export class Issue extends BaseModel {
    static get tableName() {
        return 'issues';
    }

    static get relationMappings() {
        return {
            machine: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Machine,
                join: {
                    from: 'issues.machine_id',
                    to: 'machines.id',
                },
            },

            asset: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Asset,
                join: {
                    from: 'issues.asset_id',
                    to: 'assets.id',
                },
            },

            reportedBy: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'issues.reported_by_id',
                    to: 'users.id',
                },
            },

            workOrder: {
                relation: BaseModel.HasOneRelation,
                modelClass: WorkOrder,
                join: {
                    from: 'issues.id',
                    to: 'work_orders.issue_id',
                },
            },
        };
    }

    static async updateIssue(id, updateData) {
        return await this.query().patchAndFetchById(id, updateData);
    }
}