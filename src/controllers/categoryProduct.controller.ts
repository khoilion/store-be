import { Elysia, t } from "elysia";
import CategoryProductService from "../services/CategoryProductService";

const categoryController: any = new Elysia()
    .group("/categoryProduct", group => // Change the group path
        group
            .post("/", async ({ body }) => {
                return await CategoryProductService.addCategory(body.name, body.description);
            }, {
                body: t.Object({
                    name: t.String(),
                    description: t.Optional(t.String()),
                }),
                tags: ['CategoryProduct'], // Add a tag for Swagger
            })
            .put("/:id", async ({ params, body }) => {
                return await CategoryProductService.updateCategory(params.id, body.name, body.description);
            }, {
                body: t.Object({
                    name: t.String(),
                    description: t.Optional(t.String()),
                }),
                tags: ['CategoryProduct'], // Add a tag for Swagger
            })
            .delete("/:id", async ({ params }) => {
                return await CategoryProductService.deleteCategory(params.id);
            }, {
                tags: ['CategoryProduct'], // Add a tag for Swagger
            })
            .get("/", async () => {
                return await CategoryProductService.getCategories();
            }, {
                tags: ['CategoryProduct'], // Add a tag for Swagger
            })
    );

export default categoryController;