// models/Issue.js
import { BaseModel } from './BaseModel.js';
import { Machine } from './Machine.js';
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

            reportedBy: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'issues.reported_by_id',
                    to: 'users.id',
                },
            },

            workOrder: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: WorkOrder,
                join: {
                    from: 'issues.work_order_id',
                    to: 'work_orders.id',
                },
            },
        };
    }

     // Fungsi update Issue berdasarkan ID
    static async updateIssue(id, updateData) {
        return await this.query().patchAndFetchById(id, updateData);
    }
}