import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { Machine } from './Machine.js';
import { Asset } from './Asset.js';

export class Division extends BaseModel {
  static get tableName() {
    return 'divisions';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      users: {
        relation: BaseModel.HasManyRelation,
        modelClass: User,
        join: {
          from: 'divisions.id',
          to: 'users.division_id',
        },
      },

      machines: {
        relation: BaseModel.HasManyRelation,
        modelClass: Machine,
        join: {
          from: 'divisions.id',
          to: 'machines.division_id',
        },
      },

      assets: {
        relation: BaseModel.HasManyRelation,
        modelClass: Asset,
        join: {
          from: 'divisions.id',
          to: 'assets.division_id',
        },
      },
    };
  }
}
