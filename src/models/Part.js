import { BaseModel } from './BaseModel.js';
import { PartRequestItem } from './PartRequestItem.js';
import { PartUsage } from './PartUsage.js';
import { Asset } from './Asset.js';
import { Machine } from './Machine.js';

export class Part extends BaseModel {
    static get tableName() {
        return 'parts';
    }

    static get relationMappings() {
        return {
            requestItems: {
                relation: BaseModel.HasManyRelation,
                modelClass: PartRequestItem,
                join: {
                    from: 'parts.id',
                    to: 'part_request_items.part_id',
                },
            },
            usages: {
                relation: BaseModel.HasManyRelation,
                modelClass: PartUsage,
                join: {
                    from: 'parts.id',
                    to: 'part_usages.part_id',
                },
            },
            asset: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Asset,
                join: {
                    from: 'parts.asset_id',
                    to: 'assets.id',
                },
            },
            machine: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Machine,
                join: {
                    from: 'parts.machine_id',
                    to: 'machines.id',
                },
            },
        };
    }
}
