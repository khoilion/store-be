import { Entity, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { v4 as uuidv4 } from 'uuid';
import { CategoryProduct } from "./CategoryProduct";
import { ProductStatus } from "../enums/ProductStatus.enum";

// Cập nhật interface ProductSpecifications với cấu trúc mới chi tiết hơn
export interface ProductSpecifications {
    screen?: {
        displayTechnology?: string;
        resolution?: string;
        widescreen?: string;
    };
    camera?: {
        rear?: {
            resolution?: string;
            film?: string;
            flash?: string;
            advancedPhotography?: string;
        };
        front?: {
            resolution?: string;
            videocall?: string;
            otherInformation?: string;
        };
    };
    cpu?: {
        operatingSystem?: string;
        chipset?: string;
        cpu_speed?: string;
        gpu?: string;
    };
    memory?: {
        ram?: string;
        storage?: string[];
        externalMemoryCard?: string;
    };
    connect?: {
        mobileNetwork?: string;
        sim?: string;
        wifi?: string;
        gps?: string;
        bluetooth?: string;
        connectionPort?: string;
        otherConnections?: string;
    };
    designWeight?: {
        design?: string;
        material?: string;
        size?: string;
        weight?: string;
    };
    batteryInformationCharging?: {
        batteryCapacity?: string;
        batteryType?: string;
        batteryTechnology?: string;
    };
    utilities?: {
        advancedSecurity?: string;
        specialFeatures?: string;
        musicPlayer?: string;
        moviePlayer?: string;
    }
}


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

    // Trường specifications giờ sẽ sử dụng interface mới
    @Property({ type: 'json', nullable: true })
    specifications?: ProductSpecifications;

    @ManyToOne(() => CategoryProduct)
    category!: CategoryProduct;

    constructor() {
        super();
        this._id = uuidv4();
        this.images = [];
    }
}