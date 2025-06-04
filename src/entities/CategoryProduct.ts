import { Entity, Property } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class CategoryProduct extends BaseEntity {
    @Property()
    name!: string;

    @Property()
    description?: string;

    constructor() {
        super();
        this._id = uuidv4();
    }
}