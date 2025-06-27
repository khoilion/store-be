import { Entity, Property, ManyToOne } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { v4 as uuidv4 } from 'uuid';
import { Product } from "./Product";

@Entity()
export class CartItem extends BaseEntity {
    @ManyToOne('Cart')
    cart!: any;

    @ManyToOne(() => Product)
    product!: Product;

    @Property({ type: 'integer'})
    quantity!: number;

    @Property({ type: 'decimal', precision: 12, scale: 2 })
    price!: number; // Giá tại thời điểm thêm vào giỏ hàng

    @Property({ type: 'decimal', precision: 12, scale: 2 })
    totalPrice!: number; // quantity * price

    constructor() {
        super();
        this._id = uuidv4();
    }
}