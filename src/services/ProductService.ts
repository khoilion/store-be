import {initORM} from "../db"
import {Product} from "../entities/Product"
import {CategoryProduct} from "../entities/CategoryProduct"
import type {ProductStatus} from "../enums/ProductStatus.enum"
import {type EntityManager, type Loaded, wrap} from "@mikro-orm/core"

export interface AddProductData {
    name: string
    status: ProductStatus
    description?: string
    price: number
    discount?: number
    quantity: number
    categoryProductId: string
    images?: string
}

export interface UpdateProductData {
    name?: string
    status?: ProductStatus
    description?: string | null
    price?: number
    discount?: number | null
    quantity?: number
    categoryProductId?: string
    images?: string
}

export interface GetProductsFilters {
    categoryId?: string
    status?: ProductStatus
    name?: string
    hasDiscount?: boolean
    minDiscount?: number
    minPrice?: number
    maxPrice?: number
    sortBy?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest" | "oldest"
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

        const product = em.create(Product, {
            ...data,
            category: category,
            images: imageUrls,
        })

        await em.persistAndFlush(product)
        return product
    }

    async getProducts(filters: GetProductsFilters = {}): Promise<PaginatedProductsResponse> {
        const em = await this.getEntityManager()

        // Set default values
        const page = filters.page || 1
        const limit = filters.limit || 10
        const sortBy = filters.sortBy || "newest"

        // Build query filters
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

        // Filter by discount
        if (filters.hasDiscount !== undefined) {
            if (filters.hasDiscount) {
                queryFilters.discount = {$gt: 0}
            } else {
                queryFilters.$or = [{discount: {$eq: null}}, {discount: {$eq: 0}}]
            }
        }

        if (filters.minDiscount !== undefined) {
            queryFilters.discount = {
                ...queryFilters.discount,
                $gte: filters.minDiscount,
            }
        }

        // Filter by price range
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            queryFilters.price = {}
            if (filters.minPrice !== undefined) {
                queryFilters.price.$gte = filters.minPrice
            }
            if (filters.maxPrice !== undefined) {
                queryFilters.price.$lte = filters.maxPrice
            }
        }

        // Build sort options
        const orderBy: any = {}
        switch (sortBy) {
            case "price_asc":
                orderBy.price = "ASC"
                break
            case "price_desc":
                orderBy.price = "DESC"
                break
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

        // Calculate offset
        const offset = (page - 1) * limit

        // Get total count for pagination
        const totalItems = await em.count(Product, queryFilters)
        const totalPages = Math.ceil(totalItems / limit)

        // Get products with pagination
        const products = await em.find(Product, queryFilters, {
            populate: ["category"],
            orderBy,
            limit,
            offset,
        })

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
            price: data.price ?? product.price,
            quantity: data.quantity ?? product.quantity,
        })

        if (data.hasOwnProperty("description")) {
            product.description = data.description ?? undefined
        }
        if (data.hasOwnProperty("discount")) {
            product.discount = data.discount ?? undefined
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
