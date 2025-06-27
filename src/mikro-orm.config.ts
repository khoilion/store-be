import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { CategoryProduct } from './entities/CategoryProduct';
import { User } from './entities/User';
import { Product } from './entities/Product';
import {Cart} from "./entities/Cart";
import {CartItem} from "./entities/CartItem";

export default defineConfig({
  driver: MongoDriver,
  entities: [CategoryProduct, User, Product, Cart, CartItem],
  clientUrl: process.env.DATABASE_URL,
  debug: true,
});