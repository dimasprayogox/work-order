import { BaseModel } from './BaseModel.js';
import { Part } from './Part.js';
import { WorkOrder } from './WorkOrder.js';
import { User } from './User.js';

export class PartUsage extends BaseModel {
    static get tableName() {
        return 'part_usages';
    }

    static get relationMappings() {
        return {
            part: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Part,
                join: {
                    from: 'part_usages.part_id',
                    to: 'parts.id',
                },
            },
            workOrder: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: WorkOrder,
                join: {
                    from: 'part_usages.work_order_id',
                    to: 'work_orders.id',
                },
            },
            usedBy: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'part_usages.used_by_id',
                    to: 'users.id',
                },
            },
        };
    }
}
