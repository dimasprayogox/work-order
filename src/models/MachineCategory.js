import { BaseModel } from './BaseModel.js';

export class MachineCategory extends BaseModel {
  static get tableName() {
    return 'machine_categories';
  }

  static get relationMappings() {
    return {
      machines: {
        relation: BaseModel.HasManyRelation,
        modelClass: './Machine.js',
        join: {
          from: 'machine_categories.id',
          to: 'machines.category_id',
        },
      },
    };
  }
}
