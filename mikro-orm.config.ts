import { defineConfig } from '@mikro-orm/mongodb';

export default defineConfig({
  dbName: 'storebe',
  type: 'mongo',
  clientUrl: process.env.DATABASE_URL,
});
