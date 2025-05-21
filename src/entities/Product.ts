// src/entities/Product.ts
import { Entity, Property, ManyToOne, Enum, Cascade, Loaded } from "@mikro-orm/core"; // Bỏ Rel, có thể cần Loaded
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

    // THAY ĐỔI Ở ĐÂY:
    // Sử dụng trực tiếp kiểu của Entity, không cần Rel.
    // MikroORM sẽ tự hiểu đây là một quan hệ.
    // Bạn có thể sử dụng `Loaded<CategoryProduct>` nếu muốn rõ ràng hơn về việc nó có thể được load
    // hoặc `CategoryProduct` nếu bạn thường xuyên truy cập nó sau khi đã populate.
    @ManyToOne(() => CategoryProduct, { onDelete: 'cascade' })
    category!: CategoryProduct; // Hoặc Loaded<CategoryProduct>

    constructor() {
        super();
        this._id = uuidv4();
        this.images = [];
    }
}