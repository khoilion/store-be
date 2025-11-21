import { Entity, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { v4 as uuidv4 } from 'uuid';
import { CategoryProduct } from "./CategoryProduct";
import { ProductStatus } from "../enums/ProductStatus.enum";

// *** XÓA INTERFACE ProductSpecifications CŨ ***
// Thay bằng string đơn giản cho rich text/HTML content

export interface ProductVariantDetail {
    storage: string;
    price: number;
    quantity: number;
}

@Entity()
export class Product extends BaseEntity {
    @Property()
    name!: string;

    @Enum(() => ProductStatus)
    status!: ProductStatus;

    @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    discount?: number;

    @Property({ type: 'text', nullable: true })
    description?: string;

    @Property({ type: 'json', nullable: true })
    images?: string[];

    // *** THAY ĐỔI: specifications giờ là text (HTML/rich text) ***
    @Property({ type: 'text', nullable: true })
    specifications?: string;

    @ManyToOne(() => CategoryProduct)
    category!: CategoryProduct;

    @Property({ type: 'json' })
    variants: ProductVariantDetail[] = [];

    constructor() {
        super();
        this._id = uuidv4();
        this.images = [];
        this.variants = [];
    }
}