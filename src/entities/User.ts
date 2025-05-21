import { BaseEntity } from "./BaseEntity";
import { Entity, Property, PrimaryKey } from "@mikro-orm/core";
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User extends BaseEntity {
  @PrimaryKey()
  _id: string = uuidv4(); // Automatically generate a UUID for _id

  @Property()
  username!: string;

  @Property()
  password!: string;

  @Property()
  role!: string;
}