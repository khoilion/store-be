import { Entity, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { v4 as uuidv4 } from 'uuid';
import { CategoryProduct } from "./CategoryProduct";
import { ProductStatus } from "../enums/ProductStatus.enum";

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

    @Property({ type: 'json', nullable: true })
    specifications?: ProductSpecifications;

    @ManyToOne(() => CategoryProduct)
    category!: CategoryProduct;

    // *** THÊM TRƯỜNG MỚI ĐỂ LƯU CÁC BIẾN THỂ ***
    @Property({ type: 'json' })
    variants: ProductVariantDetail[] = [];

    constructor() {
        super();
        this._id = uuidv4();
        this.images = [];
        this.variants = [];
    }
}