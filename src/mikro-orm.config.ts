import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { CategoryProduct } from './entities/CategoryProduct'; // Import your entities
import { User } from './entities/User';

export default defineConfig({
  driver: MongoDriver,
  entities: [CategoryProduct, User], // List entities explicitly if needed
  clientUrl: process.env.DATABASE_URL,
  debug: true, // Optional: Set to true for logging SQL queries
});