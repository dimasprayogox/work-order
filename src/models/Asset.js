import { BaseModel } from './BaseModel.js';
import { AssetCategory } from './AssetCategory.js';
import { Division } from './Division.js';
import { Part } from './Part.js';

export class Asset extends BaseModel {
  static get tableName() {
    return 'assets';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      category: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: AssetCategory,
        join: {
          from: 'assets.category_id',
          to: 'asset_categories.id',
        },
      },
      division: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Division,
        join: {
          from: 'assets.division_id',
          to: 'divisions.id',
        },
      },
      parts: {
        relation: BaseModel.HasManyRelation,
        modelClass: Part,
        join: {
          from: 'assets.id',
          to: 'parts.asset_id',
        },
      },
    };
  }
}
