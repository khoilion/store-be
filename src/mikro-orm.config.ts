import { defineConfig } from '@mikro-orm/core'; // Use core
import { MongoDriver } from '@mikro-orm/mongodb'; // Use MongoDriver

export default defineConfig({
  driver: MongoDriver, // Change to MongoDriver
  entities: ['src/entities'],
  clientUrl: process.env.DATABASE_URL, // Ensure this is your MongoDB URI
});