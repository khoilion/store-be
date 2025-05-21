import { Entity, Property } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

@Entity()
export class CategoryProduct extends BaseEntity {
    @Property()
    name!: string;

    @Property()
    description?: string; // Optional field for category description

    constructor() {
        super();
        this._id = uuidv4(); // Automatically generate UUID for _id
    }
}