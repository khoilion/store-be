// @ts-nocheck
import {initORM} from "../db"
import {Product, ProductSpecifications, ProductVariantDetail} from "../entities/Product"
import {CategoryProduct} from "../entities/CategoryProduct"
import type {ProductStatus} from "../enums/ProductStatus.enum"
import {type EntityManager, type Loaded, wrap} from "@mikro-orm/core"

// *** INTERFACE ĐẦU VÀO CHO VIỆC THÊM SẢN PHẨM ***
export interface AddProductData {
    name: string
    status: ProductStatus
    description?: string
    categoryProductId: string
    images?: string
    specifications?: ProductSpecifications
    discount?: number // <-- THÊM DÒNG NÀY
    variants: ProductVariantDetail[]
}

// *** INTERFACE ĐẦU VÀO CHO VIỆC CẬP NHẬT SẢN PHẨM ***
export interface UpdateProductData {
    name?: string
    status?: ProductStatus
    description?: string | null
    categoryProductId?: string
    images?: string
    specifications?: ProductSpecifications | null
    discount?: number | null // <-- THÊM DÒNG NÀY
    variants?: ProductVariantDetail[] | null
}

// *** INTERFACE CHO VIỆC LỌC SẢN PHẨM ***
export interface GetProductsFilters {
    categoryId?: string
    status?: ProductStatus
    name?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: "name_asc" | "name_desc" | "newest" | "oldest" // Loại bỏ sortBy price
    page?: number
    limit?: number
}

export interface PaginatedProductsResponse {
    data: Loaded<Product, "category">[]
    pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
        hasNextPage: boolean
        hasPreviousPage: boolean
    }
}

export class ProductService {
    private async getEntityManager(): Promise<EntityManager> {
        const db = await initORM()
        return db.em.fork()
    }

    async addProduct(data: AddProductData): Promise<Product> {
        const em = await this.getEntityManager()
        const category = await em.findOne(CategoryProduct, {_id: data.categoryProductId})
        if (!category) {
            throw new Error("Category not found")
        }

        const imageUrls = data.images
            ? data.images
                .split(",")
                .map((url) => url.trim())
                .filter((url) => url.length > 0)
            : []

        // *** TẠO SẢN PHẨM VỚI DỮ LIỆU MỚI ***
        const product = em.create(Product, {
            name: data.name,
            status: data.status,
            description: data.description,
            discount: data.discount, // <-- THÊM DÒNG NÀY
            specifications: data.specifications,
            category: category,
            images: imageUrls,
            variants: data.variants
        })

        await em.persistAndFlush(product)
        return product
    }

    async getProducts(filters: GetProductsFilters = {}): Promise<PaginatedProductsResponse> {
        const em = await this.getEntityManager()

        const page = filters.page || 1
        const limit = filters.limit || 10
        const sortBy = filters.sortBy || "newest"

        const queryFilters: any = {}

        if (filters.categoryId) {
            queryFilters.category = filters.categoryId
        }
        if (filters.status) {
            queryFilters.status = filters.status
        }
        if (filters.name) {
            queryFilters.name = {$like: `%${filters.name}%`}
        }

        if (filters.minPrice || filters.maxPrice) {
            console.warn("Lọc theo giá không được hỗ trợ khi giá được lưu trong trường JSON.");
        }


        const orderBy: any = {}
        switch (sortBy) {
            // *** LOẠI BỎ SẮP XẾP THEO GIÁ ***
            case "name_asc":
                orderBy.name = "ASC"
                break
            case "name_desc":
                orderBy.name = "DESC"
                break
            case "oldest":
                orderBy.createdAt = "ASC"
                break
            case "newest":
            default:
                orderBy.createdAt = "DESC"
                break
        }

        const offset = (page - 1) * limit

        const [products, totalItems] = await em.findAndCount(Product, queryFilters, {
            populate: ["category"],
            orderBy,
            limit,
            offset,
        })

        const totalPages = Math.ceil(totalItems / limit)

        return {
            data: products,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        }
    }

    async getProductById(id: string): Promise<Loaded<Product, "category"> | null> {
        const em = await this.getEntityManager()
        const product = await em.findOne(Product, {_id: id}, {populate: ["category"]})
        if (!product) {
            throw new Error("Product not found")
        }
        return product
    }

    async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
        const em = await this.getEntityManager()
        const product = await em.findOne(Product, {_id: id}, {populate: ["category"]})

        if (!product) {
            throw new Error("Product not found")
        }

        if (data.hasOwnProperty("images") && typeof data.images === "string") {
            product.images = data.images
                ? data.images
                    .split(",")
                    .map((url) => url.trim())
                    .filter((url) => url.length > 0)
                : []
        }

        if (data.categoryProductId && data.categoryProductId !== product.category?._id) {
            const newCategory = await em.findOne(CategoryProduct, {_id: data.categoryProductId})
            if (!newCategory) {
                throw new Error("New category not found")
            }
            product.category = newCategory
        }

        wrap(product).assign({
            name: data.name ?? product.name,
            status: data.status ?? product.status,
        })

        if (data.hasOwnProperty("description")) {
            product.description = data.description ?? undefined
        }
        if (data.hasOwnProperty("discount")) { // <-- THÊM KHỐI LỆNH NÀY
            product.discount = data.discount ?? undefined
        }
        if (data.hasOwnProperty("specifications")) {
            product.specifications = data.specifications ?? undefined;
        }
        if (data.hasOwnProperty("variants")) {
            product.variants = data.variants ?? [];
        }

        await em.persistAndFlush(product)
        return product
    }

    async deleteProduct(id: string): Promise<{ message: string }> {
        const em = await this.getEntityManager()
        const product = await em.findOne(Product, {_id: id})
        if (!product) {
            throw new Error("Product not found")
        }

        await em.removeAndFlush(product)
        return {message: "Product deleted successfully"}
    }
}

export default new ProductService()