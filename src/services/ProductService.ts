import { initORM } from "../db";
import { Product } from "../entities/Product";
import { CategoryProduct } from "../entities/CategoryProduct";
import { ProductStatus } from "../enums/ProductStatus.enum";
import { EntityManager, Loaded, wrap } from "@mikro-orm/core";
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR_PRODUCTS = path.join(process.cwd(), 'public', 'uploads', 'products');
if (!fs.existsSync(UPLOAD_DIR_PRODUCTS)) {
    fs.mkdirSync(UPLOAD_DIR_PRODUCTS, { recursive: true });
}

async function saveUploadedFile(file: File | Blob, productName: string): Promise<string> {
    if (!(file instanceof Blob)) {
        throw new Error("Invalid file object received for saving.");
    }
    const originalFileName = (file instanceof File) ? file.name : 'uploaded_image';
    const extension = path.extname(originalFileName);
    const uniqueFileName = `${productName.replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${extension}`;
    const filePath = path.join(UPLOAD_DIR_PRODUCTS, uniqueFileName);

    await Bun.write(filePath, file);

    return `/uploads/products/${uniqueFileName}`;
}

export interface AddProductData {
    name: string;
    status: ProductStatus;
    description?: string;
    price: number;
    discount?: number;
    quantity: number;
    categoryProductId: string;
    images?: (File | Blob)[];
}

export interface UpdateProductData {
    name?: string;
    status?: ProductStatus;
    description?: string | null;
    price?: number;
    discount?: number | null;
    quantity?: number;
    categoryProductId?: string;
    images?: (File | Blob)[]; // Ảnh mới để tải lên (sẽ thay thế toàn bộ ảnh cũ)
    // Để quản lý ảnh phức tạp hơn (giữ lại một số, xóa một số), cần DTO phức tạp hơn.
    // Ví dụ: `imagesToDelete?: string[]`, `existingImageUrlsToKeep?: string[]`
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

        const imageUrls: string[] = [];
        if (data.images && data.images.length > 0) {
            for (const imageFile of data.images) {
                if (imageFile instanceof Blob) {
                    const imageUrl = await saveUploadedFile(imageFile, data.name);
                    imageUrls.push(imageUrl);
                }
            }
        }

        const product = em.create(Product, {
            ...data,
            category: category,
            images: imageUrls,
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

        // Xử lý cập nhật ảnh: Đơn giản là thay thế toàn bộ ảnh cũ nếu có ảnh mới
        if (data.images && data.images.length > 0) {
            // (Tùy chọn) Xóa file ảnh cũ khỏi server tại đây
            // product.images?.forEach(oldImageUrl => { try { fs.unlinkSync(path.join(process.cwd(), 'public', oldImageUrl)); } catch (e) { console.warn(`Failed to delete old image: ${oldImageUrl}`, e); }});

            const newImageUrls: string[] = [];
            for (const imageFile of data.images) {
                if (imageFile instanceof Blob) {
                    const imageUrl = await saveUploadedFile(imageFile, data.name || product.name);
                    newImageUrls.push(imageUrl);
                }
            }
            product.images = newImageUrls;
        }

        if (data.categoryProductId && data.categoryProductId !== product.category?._id) {
            const newCategory = await em.findOne(CategoryProduct, { _id: data.categoryProductId });
            if (!newCategory) {
                throw new Error("New category not found");
            }
            product.category = newCategory;
        }

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

        // (Tùy chọn) Xóa file ảnh liên quan khỏi server
        // product.images?.forEach(imageUrl => { try { fs.unlinkSync(path.join(process.cwd(), 'public', imageUrl)); } catch (e) { console.warn(`Failed to delete image: ${imageUrl}`, e); }});

        await em.removeAndFlush(product);
        return { message: "Product deleted successfully" };
    }
}

export default new ProductService();