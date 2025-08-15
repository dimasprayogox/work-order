import { BaseModel } from './BaseModel.js';
import { Asset } from './Asset.js';

export class AssetCategory extends BaseModel {
  static get tableName() {
    return 'asset_categories';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      assets: {
        relation: BaseModel.HasManyRelation,
        modelClass: Asset,
        join: {
          from: 'asset_categories.id',
          to: 'assets.category_id',
        },
      },
    };
  }
}
