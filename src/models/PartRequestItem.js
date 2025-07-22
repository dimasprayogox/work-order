import { BaseModel } from './BaseModel.js';
import { PartRequest } from './PartRequest.js';
import { Part } from './Part.js';

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
        };
    }
}
