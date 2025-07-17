import { Model } from 'objection';
import { db } from '../core/config/knex.js';

Model.knex(db);

export class BaseModel extends Model {}
