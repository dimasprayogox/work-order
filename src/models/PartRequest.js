import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { WorkOrder } from './WorkOrder.js';
import { PartRequestItem } from './PartRequestItem.js';
import { PartUsage } from './PartUsage.js';

export class PartRequest extends BaseModel {
    static get tableName() {
        return 'part_requests';
    }

    static get relationMappings() {
        return {
            workOrder: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: WorkOrder,
                join: {
                    from: 'part_requests.work_order_id',
                    to: 'work_orders.id',
                },
            },
            requestedBy: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'part_requests.requested_by_id',
                    to: 'users.id',
                },
            },
            items: {
                relation: BaseModel.HasManyRelation,
                modelClass: PartRequestItem,
                join: {
                    from: 'part_requests.id',
                    to: 'part_request_items.part_request_id',
                },
            },
            partUsages: {
                relation: BaseModel.HasManyRelation,
                modelClass: PartUsage,
                join: {
                    from: 'part_request_items.part_id',
                    to: 'part_usages.part_id'
                }
            }
        };
    }
}
