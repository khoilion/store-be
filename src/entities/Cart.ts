import { Entity, Property, OneToMany, Collection, ManyToOne } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { v4 as uuidv4 } from 'uuid';
import { User } from "./User";

@Entity()
export class Cart extends BaseEntity {
    @ManyToOne(() => User)
    user!: User;

    @OneToMany('CartItem', 'cart')
    items = new Collection<any>(this);

    @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalAmount: number = 0;

    @Property({ type: 'integer', default: 0 })
    totalItems: number = 0;

    constructor() {
        super();
        this._id = uuidv4();
    }
}