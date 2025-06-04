import { type Opt, PrimaryKey, Property } from "@mikro-orm/core";

export abstract class BaseEntity {
  @PrimaryKey()
  _id!: string;

  @Property()
  createdAt: Date & Opt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date & Opt = new Date();
}