import { initORM } from "../db";
import { CategoryProduct } from "../entities/CategoryProduct";

export class CategoryProductService {
    async addCategory(name: string, description?: string) {
        const db = await initORM();
        const category = db.em.create(CategoryProduct, { name, description });
        await db.em.persistAndFlush(category);
        return category;
    }

    async updateCategory(id: string, name: string, description?: string) {
        const db = await initORM();
        const category = await db.em.findOne(CategoryProduct, { _id: id });
        if (!category) {
            throw new Error("Category not found");
        }
        category.name = name;
        category.description = description;
        await db.em.persistAndFlush(category);
        return category;
    }

    async deleteCategory(id: string) {
        const db = await initORM();
        const category = await db.em.findOne(CategoryProduct, { _id: id });
        if (!category) {
            throw new Error("Category not found");
        }
        await db.em.removeAndFlush(category);
        return { message: "Category deleted successfully" };
    }

    async getCategories() {
        const db = await initORM();
        return await db.em.find(CategoryProduct, {});
    }

    async getCategoryById(id: string) {
        const db = await initORM();
        const category = await db.em.findOne(CategoryProduct, { _id: id });
        if (!category) {
            throw new Error("Category not found");
        }
        return category;
    }
}

export default new CategoryProductService();