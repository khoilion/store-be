import { type Opt, PrimaryKey, Property } from "@mikro-orm/core";

export abstract class BaseEntity {
  @PrimaryKey()
  _id!: string; // Use UUID or another identifier

  @Property()
  createdAt: Date & Opt = new Date(); // Timestamp for creation

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date & Opt = new Date(); // Timestamp for updates
}