import { BaseModel } from './BaseModel.js';
import { Machine } from './Machine.js';
import { User } from './User.js';

export class MaintenanceSchedule extends BaseModel {
    static get tableName() {
        return 'maintenance_schedules';
    }

    static get relationMappings() {
        return {
            machine: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Machine,
                join: {
                    from: 'maintenance_schedules.machine_id',
                    to: 'machines.id',
                },
            },

            createdBy: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'maintenance_schedules.created_by_id',
                    to: 'users.id',
                },
            },
        };
    }
}
