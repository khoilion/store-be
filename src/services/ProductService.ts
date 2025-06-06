// src/services/ProductService.ts

import { initORM } from "../db";
import { Product } from "../entities/Product";
import { CategoryProduct } from "../entities/CategoryProduct";
import { ProductStatus } from "../enums/ProductStatus.enum";
import { EntityManager, Loaded, wrap } from "@mikro-orm/core";

// Interface để định nghĩa dữ liệu khi thêm sản phẩm
export interface AddProductData {
    name: string;
    status: ProductStatus;
    description?: string;
    price: number;
    discount?: number;
    quantity: number;
    categoryProductId: string;
    images?: string; // Chuỗi các URL, cách nhau bằng dấu phẩy
}

// Interface để định nghĩa dữ liệu khi cập nhật sản phẩm
export interface UpdateProductData {
    name?: string;
    status?: ProductStatus;
    description?: string | null;
    price?: number;
    discount?: number | null;
    quantity?: number;
    categoryProductId?: string;
    images?: string; // Chuỗi các URL, cách nhau bằng dấu phẩy
}

export class ProductService {
    private async getEntityManager(): Promise<EntityManager> {
        const db = await initORM();
        return db.em.fork();
    }

    async addProduct(data: AddProductData): Promise<Product> {
        const em = await this.getEntityManager();
        const category = await em.findOne(CategoryProduct, { _id: data.categoryProductId });
        if (!category) {
            throw new Error("Category not found");
        }

        // Xử lý chuỗi URL hình ảnh thành một mảng
        const imageUrls = data.images
          ? data.images.split(',').map(url => url.trim()).filter(url => url.length > 0)
          : [];

        const product = em.create(Product, {
            ...data,
            category: category,
            images: imageUrls, // Lưu mảng URL vào entity
        });

        await em.persistAndFlush(product);
        return product;
    }

    async getProducts(filters: { categoryId?: string, status?: ProductStatus, name?: string } = {}): Promise<Loaded<Product, "category">[]> {
        const em = await this.getEntityManager();
        const findOptions: any = { populate: ['category'] };
        const queryFilters: any = {};

        if (filters.categoryId) {
            queryFilters.category = filters.categoryId;
        }
        if (filters.status) {
            queryFilters.status = filters.status;
        }
        if (filters.name) {
            queryFilters.name = { $like: `%${filters.name}%` };
        }

        return await em.find(Product, queryFilters, findOptions);
    }

    async getProductById(id: string): Promise<Loaded<Product, "category"> | null> {
        const em = await this.getEntityManager();
        const product = await em.findOne(Product, { _id: id }, { populate: ['category'] });
        if (!product) {
            throw new Error("Product not found");
        }
        return product;
    }

    async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
        const em = await this.getEntityManager();
        const product = await em.findOne(Product, { _id: id }, { populate: ['category'] });

        if (!product) {
            throw new Error("Product not found");
        }

        // Cập nhật logic xử lý ảnh:
        // Nếu trường 'images' được cung cấp (kể cả chuỗi rỗng), thì cập nhật.
        // Nếu không (undefined), giữ nguyên ảnh cũ.
        if (data.hasOwnProperty('images') && typeof data.images === 'string') {
            product.images = data.images
              ? data.images.split(',').map(url => url.trim()).filter(url => url.length > 0)
              : []; // Nếu gửi chuỗi rỗng, mảng ảnh sẽ rỗng -> xóa hết ảnh.
        }

        if (data.categoryProductId && data.categoryProductId !== product.category?._id) {
            const newCategory = await em.findOne(CategoryProduct, { _id: data.categoryProductId });
            if (!newCategory) {
                throw new Error("New category not found");
            }
            product.category = newCategory;
        }

        // Gán các trường còn lại
        wrap(product).assign({
            name: data.name ?? product.name,
            status: data.status ?? product.status,
            price: data.price ?? product.price,
            quantity: data.quantity ?? product.quantity,
        });

        if (data.hasOwnProperty('description')) {
            product.description = data.description ?? undefined;
        }
        if (data.hasOwnProperty('discount')) {
            product.discount = data.discount ?? undefined;
        }

        await em.persistAndFlush(product);
        return product;
    }

    async deleteProduct(id: string): Promise<{ message: string }> {
        const em = await this.getEntityManager();
        const product = await em.findOne(Product, { _id: id });
        if (!product) {
            throw new Error("Product not found");
        }

        // Việc dọn dẹp file trên Minio nên được xử lý bằng một cơ chế riêng nếu cần.
        await em.removeAndFlush(product);
        return { message: "Product deleted successfully" };
    }
}

// Export một instance của service để sử dụng (Singleton pattern)
export default new ProductService();