import { Elysia } from "elysia";
import { initORM } from "./db";
import { RequestContext } from "@mikro-orm/core";
import responseMiddleware from "./middlewares/responseMiddleware";
import errorMiddleware from "./middlewares/errorMiddleware";
import userController from "./controllers/user.controller";
import categoryController from "./controllers/categoryProduct.controller";
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { opentelemetry } from '@elysiajs/opentelemetry';
import productController from "./controllers/product.controller";
import uploadController from "./controllers/upload.controller";
import cartController from "./controllers/cart.controller";

const startApp = async () => {
  try {
    const dataSource = await initORM();
    await dataSource.orm.getSchemaGenerator().updateSchema();

    const app = new Elysia()
        .use(cors())
        .get("/", () => "It's works!")
        .use(swagger({
          path: '/swagger-ui',
          provider: 'swagger-ui',
          documentation: {
            info: {
              title: 'Elysia template v3',
              description: 'Elysia template API Documentation',
              version: '1.0.3',
            },
            components: {
              securitySchemes: {
                JwtAuth: {
                  type: 'http',
                  scheme: 'bearer',
                  bearerFormat: 'JWT',
                  description: 'Enter JWT Bearer token **_only_**'
                }
              }
            },
          },
          swaggerOptions: {
            persistAuthorization: true,
          }
        }))
        .use(opentelemetry())
        .onBeforeHandle(() => RequestContext.enter(dataSource.em))
        .onAfterHandle(responseMiddleware)
        .onError(errorMiddleware)
        .group("/api", group =>
            group
                .use(userController)
                .use(categoryController)
                .use(productController)
                .use(uploadController)
                .use(cartController)
        )
        .listen(3000);

    console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
    console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/swagger-ui`);
  } catch (err) {
    console.error(err);
  }
};

startApp().then();