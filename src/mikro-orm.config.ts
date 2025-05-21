import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { CategoryProduct } from './entities/CategoryProduct';
import { User } from './entities/User';
import { Product } from './entities/Product';

export default defineConfig({
  driver: MongoDriver,
  entities: [CategoryProduct, User, Product],
  clientUrl: process.env.DATABASE_URL,
  debug: true,
});