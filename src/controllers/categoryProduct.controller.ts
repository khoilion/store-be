import {Elysia, t} from "elysia";
import CategoryProductService from "../services/CategoryProductService";

const categoryController: any = new Elysia()
    .group("/categoryProduct", group => // Change the group path
        group
            .post("/", async ({body}) => {
                return await CategoryProductService.addCategory(body.name, body.description);
            }, {
                body: t.Object({
                    name: t.String(),
                    description: t.Optional(t.String()),
                }),
                detail: {
                    tags: ['CategoryProduct'],
                    summary: 'create categoryproduct',
                    security: [
                        {JwtAuth: []}
                    ],
                }
            })
            .get("/:id", async ({params, set}) => {
                try {
                    const category = await CategoryProductService.getCategoryById(params.id);
                    return category;
                } catch (error: any) {
                    console.log(error)
                }
            }, {
                params: t.Object({ // Validate path parameters
                    id: t.String()
                }),
                detail: {
                    tags: ['CategoryProduct'],
                    summary: 'Get a product category by ID'
                }
            })
            .put("/:id", async ({params, body}) => {
                return await CategoryProductService.updateCategory(params.id, body.name, body.description);
            }, {
                body: t.Object({
                    name: t.String(),
                    description: t.Optional(t.String()),
                }),
                detail: {
                    tags: ['CategoryProduct'],
                    summary: 'edit categoryproduct by ib',
                    security: [
                        {JwtAuth: []}
                    ],
                }
            })
            .delete("/:id", async ({params}) => {
                return await CategoryProductService.deleteCategory(params.id);
            }, {
                detail: {
                    tags: ['CategoryProduct'],
                    summary: 'delete categoryproduct by id',
                    security: [
                        {JwtAuth: []}
                    ],
                }
            })
            .get("/", async () => {
                return await CategoryProductService.getCategories();
            }, {
                detail: {
                    tags: ['CategoryProduct'],
                    summary: 'get all categoryproduct'
                }
            })
    );

export default categoryController;