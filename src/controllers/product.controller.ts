import { Elysia, t } from "elysia";
import ProductService from "../services/ProductService";
import { ProductStatus } from "../enums/ProductStatus.enum";

// @ts-ignore
const handleServiceError = (error: any, set: Elysia.Set) => {
    if (error instanceof Error) {
        if (error.message.includes("not found")) {
            set.status = 404;
            return { message: error.message };
        }
    }
    set.status = 500;
    console.error("Product API Error:", error);
    return { message: "An internal server error occurred." };
};

// --- THAY ĐỔI 1: Cập nhật Schema để nhận chuỗi URL thay vì file ---
const AddProductBodySchema = t.Object({
    name: t.String({ minLength: 1, error: "Tên sản phẩm không được để trống" }),
    status: t.Enum(ProductStatus, { error: "Trạng thái không hợp lệ" }),
    description: t.Optional(t.String()),
    price: t.Number({ minimum: 0, error: "Giá phải là số không âm" }),
    discount: t.Optional(t.Number({ minimum: 0 })),
    quantity: t.Integer({ minimum: 0, error: "Số lượng phải là số nguyên không âm" }),
    categoryProductId: t.String({ format: 'uuid', error: "ID danh mục không hợp lệ" }),
    // Nhận một chuỗi chứa các URL, cách nhau bằng dấu phẩy
    images: t.Optional(t.String({
        description: 'Chuỗi các URL hình ảnh, cách nhau bằng dấu phẩy (,)'
    }))
});

const UpdateProductBodySchema = t.Object({
    name: t.Optional(t.String({ minLength: 1 })),
    status: t.Optional(t.Enum(ProductStatus)),
    description: t.Optional(t.Union([t.String(), t.Null()])),
    price: t.Optional(t.Number({ minimum: 0 })),
    discount: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
    quantity: t.Optional(t.Integer({ minimum: 0 })),
    categoryProductId: t.Optional(t.String({ format: 'uuid' })),
    // Tương tự, nhận chuỗi URL
    images: t.Optional(t.String({
        description: 'Chuỗi các URL hình ảnh, cách nhau bằng dấu phẩy (,). Gửi chuỗi rỗng để xóa hết ảnh.'
    }))
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
    async ({ body, set, ProductService: service }) => {
        try {
            // Dữ liệu body đã đúng định dạng, chỉ cần truyền xuống service
            const product = await service.addProduct(body as any);
            set.status = 201;
            return product;
        } catch (error: any) {
            return handleServiceError(error, set);
        }
    },
    {
        body: AddProductBodySchema,
        // --- THAY ĐỔI 2: Bỏ 'multipart/form-data', giờ đây là 'application/json' (mặc định) ---
        // type: 'multipart/form-data',
        detail: {
            tags: ['Product'],
            summary: 'Thêm sản phẩm mới',
        }
    }
  )
  .get(
    "/",
    async ({ query, set, ProductService: service }) => {
        try {
            return await service.getProducts(query);
        } catch (error: any) {
            console.error("Error fetching products:", error);
            set.status = 500; // Thêm set vào đây
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
            // Dữ liệu body đã đúng định dạng, chỉ cần truyền xuống service
            const product = await service.updateProduct(params.id, body as any);
            return product;
        } catch (error: any) {
            return handleServiceError(error, set);
        }
    },
    {
        params: ProductIdParamsSchema,
        body: UpdateProductBodySchema,
        // --- THAY ĐỔI 3: Bỏ 'multipart/form-data' ---
        // type: 'multipart/form-data',
        detail: {
            tags: ['Product'],
            summary: 'Cập nhật sản phẩm',
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