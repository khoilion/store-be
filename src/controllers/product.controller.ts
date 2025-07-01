import {Elysia, t} from "elysia"
import ProductService from "../services/ProductService"
import {ProductStatus} from "../enums/ProductStatus.enum"

// @ts-ignore
const handleServiceError = (error: any, set: Elysia.Set) => {
    if (error instanceof Error) {
        if (error.message.includes("not found")) {
            set.status = 404
            return {message: error.message}
        }
    }
    set.status = 500
    console.error("Product API Error:", error)
    return {message: "An internal server error occurred."}
}

const AddProductBodySchema = t.Object({
    name: t.String({minLength: 1, error: "Tên sản phẩm không được để trống"}),
    status: t.Enum(ProductStatus, {error: "Trạng thái không hợp lệ"}),
    description: t.Optional(t.String()),
    price: t.Number({minimum: 0, error: "Giá phải là số không âm"}),
    discount: t.Optional(t.Number({minimum: 0})),
    quantity: t.Integer({minimum: 0, error: "Số lượng phải là số nguyên không âm"}),
    categoryProductId: t.String({format: "uuid", error: "ID danh mục không hợp lệ"}),
    images: t.Optional(
        t.String({
            description: "Chuỗi các URL hình ảnh, cách nhau bằng dấu phẩy (,)",
        }),
    ),
})

const UpdateProductBodySchema = t.Object({
    name: t.Optional(t.String({minLength: 1})),
    status: t.Optional(t.Enum(ProductStatus)),
    description: t.Optional(t.Union([t.String(), t.Null()])),
    price: t.Optional(t.Number({minimum: 0})),
    discount: t.Optional(t.Union([t.Number({minimum: 0}), t.Null()])),
    quantity: t.Optional(t.Integer({minimum: 0})),
    categoryProductId: t.Optional(t.String({format: "uuid"})),
    images: t.Optional(
        t.String({
            description: "Chuỗi các URL hình ảnh, cách nhau bằng dấu phẩy (,). Gửi chuỗi rỗng để xóa hết ảnh.",
        }),
    ),
})

const ProductIdParamsSchema = t.Object({
    id: t.String({format: "uuid", error: "ID sản phẩm không hợp lệ"}),
})

// Cập nhật schema cho query parameters
const GetProductsQuerySchema = t.Object({
    // Filters
    categoryId: t.Optional(t.String({format: "uuid"})),
    status: t.Optional(t.Enum(ProductStatus)),
    name: t.Optional(t.String()),
    hasDiscount: t.Optional(t.Boolean({description: "Lọc sản phẩm có giảm giá"})),
    minDiscount: t.Optional(t.Number({minimum: 0, description: "Giảm giá tối thiểu (%)"})),
    minPrice: t.Optional(t.Number({minimum: 0, description: "Giá tối thiểu"})),
    maxPrice: t.Optional(t.Number({minimum: 0, description: "Giá tối đa"})),

    // Sorting
    sortBy: t.Optional(
        t.Union(
            [
                t.Literal("price_asc"),
                t.Literal("price_desc"),
                t.Literal("name_asc"),
                t.Literal("name_desc"),
                t.Literal("newest"),
                t.Literal("oldest"),
            ],
            {description: "Sắp xếp theo: price_asc, price_desc, name_asc, name_desc, newest, oldest"},
        ),
    ),

    // Pagination
    page: t.Optional(t.Integer({minimum: 1, default: 1, description: "Số trang (bắt đầu từ 1)"})),
    limit: t.Optional(
        t.Integer({minimum: 1, maximum: 100, default: 10, description: "Số lượng sản phẩm mỗi trang (tối đa 100)"}),
    ),
})

const productController = new Elysia({prefix: "/products"})
    .decorate("ProductService", ProductService)
    .post(
        "/",
        async ({body, set, ProductService: service}) => {
            try {
                const product = await service.addProduct(body as any)
                set.status = 201
                return product
            } catch (error: any) {
                return handleServiceError(error, set)
            }
        },
        {
            body: AddProductBodySchema,
            detail: {
                tags: ["Product"],
                summary: "Thêm sản phẩm mới",
                security: [{JwtAuth: []}],
            },
        },
    )
    .get(
        "/",
        async ({query, set, ProductService: service}) => {
            try {
                const result = await service.getProducts(query)
                return result
            } catch (error: any) {
                console.error("Error fetching products:", error)
                set.status = 500
                return {message: "Failed to fetch products"}
            }
        },
        {
            query: GetProductsQuerySchema,
            detail: {
                tags: ["Product"],
                summary: "Lấy danh sách sản phẩm với lọc, sắp xếp và phân trang",
                description: `
                                Lấy danh sách sản phẩm với các tùy chọn:
                                - Lọc theo danh mục, trạng thái, tên, giá, giảm giá
                                - Sắp xếp theo giá (thấp->cao, cao->thấp), tên (A-Z, Z-A), thời gian tạo
                                - Phân trang với page và limit
                                - Mặc định hiển thị sản phẩm mới nhất trước
                               `,
            },
        },
    )
    .get(
        "/:id",
        async ({params, set, ProductService: service}) => {
            try {
                const product = await service.getProductById(params.id)
                return product
            } catch (error: any) {
                return handleServiceError(error, set)
            }
        },
        {
            params: ProductIdParamsSchema,
            detail: {
                tags: ["Product"],
                summary: "Lấy thông tin sản phẩm theo ID",
            },
        },
    )
    .put(
        "/:id",
        async ({params, body, set, ProductService: service}) => {
            try {
                const product = await service.updateProduct(params.id, body as any)
                return product
            } catch (error: any) {
                return handleServiceError(error, set)
            }
        },
        {
            params: ProductIdParamsSchema,
            body: UpdateProductBodySchema,
            detail: {
                tags: ["Product"],
                summary: "Cập nhật sản phẩm",
                security: [{JwtAuth: []}],
            },
        },
    )
    .delete(
        "/:id",
        async ({params, set, ProductService: service}) => {
            try {
                return await service.deleteProduct(params.id)
            } catch (error: any) {
                return handleServiceError(error, set)
            }
        },
        {
            params: ProductIdParamsSchema,
            detail: {
                tags: ["Product"],
                summary: "Xóa sản phẩm theo ID",
                security: [{JwtAuth: []}],
            },
        },
    )

export default productController
