// src/controllers/product.controller.ts
import { Elysia, t } from "elysia";
import ProductService from "../services/ProductService"; // Đường dẫn đúng
// Sửa đường dẫn import ProductStatus nếu cần
import { ProductStatus } from "../enums/ProductStatus.enum"; // Đảm bảo đường dẫn này đúng

// Helper xử lý lỗi không tìm thấy
const handleServiceError = (error: any, set: Elysia.Set) => {
    if (error instanceof Error) {
        if (error.message.includes("not found")) {
            set.status = 404;
            return { message: error.message };
        }
        // Có thể thêm các lỗi nghiệp vụ khác ở đây
    }
    set.status = 500;
    console.error("Product API Error:", error);
    return { message: "An internal server error occurred." };
};

// Schemas cho validation (DTOs)
const AddProductBodySchema = t.Object({
    name: t.String({ minLength: 1, error: "Tên sản phẩm không được để trống" }),
    status: t.Enum(ProductStatus, { error: "Trạng thái không hợp lệ" }),
    description: t.Optional(t.String()),
    price: t.Number({ minimum: 0, error: "Giá phải là số không âm" }),
    discount: t.Optional(t.Number({ minimum: 0 })),
    quantity: t.Integer({ minimum: 0, error: "Số lượng phải là số nguyên không âm" }),
    categoryProductId: t.String({ format: 'uuid', error: "ID danh mục không hợp lệ" }),
    images: t.Optional(
        t.Files({ // Cho phép nhiều file
            // Bỏ các constraints nếu không cần thiết cho việc test ban đầu
            // Hoặc đảm bảo chúng không quá chặt chẽ gây lỗi khi test
            // Ví dụ:
            // minItems: 0, // Cho phép không có file nào
            // maxItems: 5, // Tối đa 5 file
            // type: ['image/jpeg', 'image/png', 'image/webp'],
            // maxSize: '5m' // Kích thước tối đa 5MB mỗi file
        })
    )
});

const UpdateProductBodySchema = t.Object({
    name: t.Optional(t.String({ minLength: 1 })),
    status: t.Optional(t.Enum(ProductStatus)),
    description: t.Optional(t.Union([t.String(), t.Null()])),
    price: t.Optional(t.Number({ minimum: 0 })),
    discount: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
    quantity: t.Optional(t.Integer({ minimum: 0 })),
    categoryProductId: t.Optional(t.String({ format: 'uuid' })),
    images: t.Optional(t.Files())
});

const ProductIdParamsSchema = t.Object({
    id: t.String({ format: 'uuid', error: "ID sản phẩm không hợp lệ" })
});

const GetProductsQuerySchema = t.Object({
    categoryId: t.Optional(t.String({ format: 'uuid' })),
    status: t.Optional(t.Enum(ProductStatus)),
    name: t.Optional(t.String())
});

const productController = new Elysia({ prefix: "/products" })
    .decorate('ProductService', ProductService)
    .post(
        "/",
        async ({ body, set, ProductService: service }) => { // Đổi tên để tránh nhầm lẫn nếu cần
            try {
                const productData = {
                    name: body.name,
                    status: body.status,
                    description: body.description,
                    price: body.price,
                    discount: body.discount,
                    quantity: body.quantity,
                    categoryProductId: body.categoryProductId,
                    images: body.images // body.images sẽ là Array<File | Blob> hoặc undefined
                };
                const product = await service.addProduct(productData as any); // Type assertion cần cẩn thận
                set.status = 201;
                return product;
            } catch (error: any) {
                return handleServiceError(error, set);
            }
        },
        {
            body: AddProductBodySchema,
            type: 'multipart/form-data', // << --- THÊM DÒNG NÀY ---
            detail: {
                tags: ['Product'],
                summary: 'Thêm sản phẩm mới (hỗ trợ tải nhiều ảnh)',
                // `consumes` thường được suy ra từ `type: 'multipart/form-data'`
                // nhưng để chắc chắn, bạn có thể giữ lại nếu phiên bản Swagger của bạn cần
                // consumes: ['multipart/form-data'],
            }
        }
    )
    .get(
        "/",
        async ({ query, ProductService: service }) => {
            try {
                return await service.getProducts(query);
            } catch (error: any) {
                console.error("Error fetching products:", error);
                set.status = 500;
                return { message: "Failed to fetch products" };
            }
        },
        {
            query: GetProductsQuerySchema,
            detail: {
                tags: ['Product'],
                summary: 'Lấy danh sách sản phẩm (có thể lọc)'
            }
        }
    )
    .get(
        "/:id",
        async ({ params, set, ProductService: service }) => {
            try {
                const product = await service.getProductById(params.id);
                return product;
            } catch (error: any) {
                return handleServiceError(error, set);
            }
        },
        {
            params: ProductIdParamsSchema,
            detail: {
                tags: ['Product'],
                summary: 'Lấy thông tin sản phẩm theo ID'
            }
        }
    )
    .put(
        "/:id",
        async ({ params, body, set, ProductService: service }) => {
            try {
                const updateData = {
                    name: body.name,
                    status: body.status,
                    description: body.description,
                    price: body.price,
                    discount: body.discount,
                    quantity: body.quantity,
                    categoryProductId: body.categoryProductId,
                    images: body.images // body.images sẽ là Array<File | Blob> hoặc undefined
                };
                const product = await service.updateProduct(params.id, updateData as any);
                return product;
            } catch (error: any) {
                return handleServiceError(error, set);
            }
        },
        {
            params: ProductIdParamsSchema,
            body: UpdateProductBodySchema,
            type: 'multipart/form-data', // << --- THÊM DÒNG NÀY ---
            detail: {
                tags: ['Product'],
                summary: 'Cập nhật sản phẩm (hỗ trợ tải ảnh mới)',
                // consumes: ['multipart/form-data'],
            }
        }
    )
    .delete(
        "/:id",
        async ({ params, set, ProductService: service }) => {
            try {
                return await service.deleteProduct(params.id);
            } catch (error: any) {
                return handleServiceError(error, set);
            }
        },
        {
            params: ProductIdParamsSchema,
            detail: {
                tags: ['Product'],
                summary: 'Xóa sản phẩm theo ID'
            }
        }
    );

export default productController;