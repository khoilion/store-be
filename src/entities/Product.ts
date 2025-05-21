import { Entity, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { v4 as uuidv4 } from 'uuid';
import { CategoryProduct } from "./CategoryProduct";
import { ProductStatus } from "../enums/ProductStatus.enum";

@Entity()
export class Product extends BaseEntity {
    @Property()
    name!: string;

    @Enum(() => ProductStatus)
    status!: ProductStatus;

    @Property({ type: 'text', nullable: true })
    description?: string;

    @Property({ type: 'decimal', precision: 12, scale: 2 })
    price!: number;

    @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    discount?: number;

    @Property({ type: 'integer' })
    quantity!: number;

    @Property({ type: 'json', nullable: true })
    images?: string[];

    @ManyToOne(() => CategoryProduct, { onDelete: 'cascade' })
    category!: CategoryProduct;

    constructor() {
        super();
        this._id = uuidv4();
        this.images = [];
    }
}