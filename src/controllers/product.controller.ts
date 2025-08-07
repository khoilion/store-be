// @ts-nocheck
import {Elysia, t} from "elysia"
import ProductService from "../services/ProductService"
import {ProductStatus} from "../enums/ProductStatus.enum"

const SpecificationsSchema = t.Object({
    screen: t.Optional(t.Object({
        displayTechnology: t.Optional(t.String()),
        resolution: t.Optional(t.String()),
        widescreen: t.Optional(t.String()),
    })),
    camera: t.Optional(t.Object({
        rear: t.Optional(t.Object({
            resolution: t.Optional(t.String()),
            film: t.Optional(t.String()),
            flash: t.Optional(t.String()),
            advancedPhotography: t.Optional(t.String()),
        })),
        front: t.Optional(t.Object({
            resolution: t.Optional(t.String()),
            videocall: t.Optional(t.String()),
            otherInformation: t.Optional(t.String()),
        })),
    })),
    cpu: t.Optional(t.Object({
        operatingSystem: t.Optional(t.String()),
        chipset: t.Optional(t.String()),
        cpu_speed: t.Optional(t.String()),
        gpu: t.Optional(t.String()),
    })),
    memory: t.Optional(t.Object({
        ram: t.Optional(t.String()),
        storage: t.Optional(t.Array(t.String())),
        externalMemoryCard: t.Optional(t.String()),
    })),
    connect: t.Optional(t.Object({
        mobileNetwork: t.Optional(t.String()),
        sim: t.Optional(t.String()),
        wifi: t.Optional(t.String()),
        gps: t.Optional(t.String()),
        bluetooth: t.Optional(t.String()),
        connectionPort: t.Optional(t.String()),
        otherConnections: t.Optional(t.String()),
    })),
    designWeight: t.Optional(t.Object({
        design: t.Optional(t.String()),
        material: t.Optional(t.String()),
        size: t.Optional(t.String()),
        weight: t.Optional(t.String()),
    })),
    batteryInformationCharging: t.Optional(t.Object({
        batteryCapacity: t.Optional(t.String()),
        batteryType: t.Optional(t.String()),
        batteryTechnology: t.Optional(t.String()),
    })),
    utilities: t.Optional(t.Object({
        advancedSecurity: t.Optional(t.String()),
        specialFeatures: t.Optional(t.String()),
        musicPlayer: t.Optional(t.String()),
        moviePlayer: t.Optional(t.String()),
    }))
}, {description: "Thông số kỹ thuật chi tiết của sản phẩm"});

// *** SCHEMA CHO MỘT CHI TIẾT BIẾN THỂ (DUNG LƯỢNG/GIÁ) ***
const VariantDetailSchema = t.Object({
    storage: t.String({minLength: 1, error: "Dung lượng không được để trống"}),
    price: t.Number({minimum: 0, error: "Giá phải là số không âm"}),
    quantity: t.Integer({minimum: 0, error: "Số lượng phải là số nguyên không âm"}),
});

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

// *** CẬP NHẬT SCHEMA CHO VIỆC THÊM SẢN PHẨM ***
const AddProductBodySchema = t.Object({
    name: t.String({minLength: 1, error: "Tên sản phẩm không được để trống"}),
    status: t.Enum(ProductStatus, {error: "Trạng thái không hợp lệ"}),
    description: t.Optional(t.String()),
    discount: t.Optional(t.Number({minimum: 0})),
    categoryProductId: t.String({format: "uuid", error: "ID danh mục không hợp lệ"}),
    images: t.Optional(
        t.String({
            description: "Chuỗi các URL hình ảnh chung, cách nhau bằng dấu phẩy (,)",
        }),
    ),
    specifications: t.Optional(SpecificationsSchema),
    variants: t.Array(VariantDetailSchema, {
        minItems: 1,
        error: "Sản phẩm phải có ít nhất một tùy chọn giá và dung lượng."
    })
})

const UpdateProductBodySchema = t.Object({
    name: t.Optional(t.String({minLength: 1})),
    status: t.Optional(t.Enum(ProductStatus)),
    // Thêm trường discount ở cấp cao nhất
    discount: t.Optional(t.Union([t.Number({minimum: 0}), t.Null()])),
    description: t.Optional(t.Union([t.String(), t.Null()])),
    categoryProductId: t.Optional(t.String({format: "uuid"})),
    images: t.Optional(
        t.String({
            description: "Chuỗi các URL hình ảnh, cách nhau bằng dấu phẩy (,). Gửi chuỗi rỗng để xóa hết ảnh.",
        }),
    ),
    specifications: t.Optional(t.Union([SpecificationsSchema, t.Null()])),
    variants: t.Optional(t.Union([t.Array(VariantDetailSchema), t.Null()]))
})

const ProductIdParamsSchema = t.Object({
    id: t.String({format: "uuid", error: "ID sản phẩm không hợp lệ"}),
})

// *** CẬP NHẬT SCHEMA CHO QUERY PARAMETERS ***
const GetProductsQuerySchema = t.Object({
    categoryId: t.Optional(t.String({format: "uuid"})),
    status: t.Optional(t.Enum(ProductStatus)),
    name: t.Optional(t.String()),
    minPrice: t.Optional(t.Number({minimum: 0, description: "Giá tối thiểu (không được hỗ trợ)"})),
    maxPrice: t.Optional(t.Number({minimum: 0, description: "Giá tối đa (không được hỗ trợ)"})),

    sortBy: t.Optional(
        t.Union(
            [
                t.Literal("name_asc"),
                t.Literal("name_desc"),
                t.Literal("newest"),
                t.Literal("oldest"),
            ],
            {description: "Sắp xếp theo: name_asc, name_desc, newest, oldest"},
        ),
    ),

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
                summary: "Thêm sản phẩm mới với các tùy chọn giá",
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