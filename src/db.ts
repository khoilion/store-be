import {EntityManager, EntityRepository, MikroORM, Options} from "@mikro-orm/mongodb"; // Change to mongodb
import {User} from "./entities/User";
import config from './mikro-orm.config';
import {CategoryProduct} from "./entities/CategoryProduct";

export interface Services {
    orm: MikroORM;
    em: EntityManager;
    user: EntityRepository<User>;
    categoryProduct: EntityRepository<CategoryProduct>
}

let dataSource: Services;

// Initialize the ORM then return the data source, this will use data source as a cache so calling multiple times will not reinitialize the ORM
export async function initORM(options?: Options): Promise<Services> {
    if (dataSource) return dataSource;

    // Allow overriding config options for testing
    const orm = await MikroORM.init({
        ...config,
        ...options,
    });

    // Save to cache before returning
    dataSource = {
        orm,
        em: orm.em,
        user: orm.em.getRepository(User),
        categoryProduct: orm.em.getRepository(CategoryProduct)
    };
    return dataSource;
}