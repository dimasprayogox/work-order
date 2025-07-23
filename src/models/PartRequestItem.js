import { BaseModel } from './BaseModel.js';
import { PartRequest } from './PartRequest.js';
import { Part } from './Part.js';
import { PartUsage } from './PartUsage.js';

export class PartRequestItem extends BaseModel {
    static get tableName() {
        return 'part_request_items';
    }

    static get relationMappings() {
        return {
            request: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: PartRequest,
                join: {
                    from: 'part_request_items.part_request_id',
                    to: 'part_requests.id',
                },
            },
            part: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Part,
                join: {
                    from: 'part_request_items.part_id',
                    to: 'parts.id',
                },
            },

            partUsages: {
                relation: BaseModel.HasManyRelation,
                modelClass: PartUsage,
                join: {
                    from: "part_request_items.id",
                    to: "part_usages.part_request_item_id"
                }
            }
        };
    }
}
