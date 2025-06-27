import {Elysia, t} from "elysia";
import cartService from "../services/CartService";
import authMacro from "../macros/auth";

const handleServiceError = (error: any, set: any) => {
    if (error instanceof Error) {
        if (error.message.includes("not found")) {
            set.status = 404;
            return {message: error.message};
        }
        if (error.message.includes("out of stock") ||
            error.message.includes("available in stock")) {
            set.status = 400;
            return {message: error.message};
        }
    }
    set.status = 500;
    console.error("Cart API Error:", error);
    return {message: "An internal server error occurred."};
};

// Schema validation
const AddToCartBodySchema = t.Object({
    productId: t.String({
        format: 'uuid',
        error: "Product ID không hợp lệ"
    }),
    quantity: t.Integer({
        minimum: 1,
        error: "Số lượng phải là số nguyên dương"
    })
});

const UpdateCartItemBodySchema = t.Object({
    productId: t.String({
        format: 'uuid',
        error: "Product ID không hợp lệ"
    }),
    quantity: t.Integer({
        minimum: 1,
        error: "Số lượng phải là số nguyên dương"
    })
});

const ProductIdParamsSchema = t.Object({
    productId: t.String({
        format: 'uuid',
        error: "Product ID không hợp lệ"
    })
});

const cartController = new Elysia({prefix: "/cart"})
    .use(cartService)
    .use(authMacro)

    // Thêm sản phẩm vào giỏ hàng
    .post(
        "/add",
        async ({body, user, cartService, set}) => {
            try {
                const result = await cartService.addToCart({
                    userId: user._id,
                    productId: body.productId,
                    quantity: body.quantity
                });
                return result;
            } catch (error: any) {
                return handleServiceError(error, set);
            }
        },
        {
            checkAuth: ['user'],
            body: AddToCartBodySchema,
            detail: {
                tags: ['Cart'],
                summary: 'Thêm sản phẩm vào giỏ hàng',
                security: [{JwtAuth: []}],
                description: 'Thêm sản phẩm vào giỏ hàng của user hiện tại'
            }
        }
    )

    // Lấy giỏ hàng của user hiện tại
    .get(
        "/",
        async ({user, cartService, set}) => {
            try {
                return await cartService.getCartByUserId(user._id);
            } catch (error: any) {
                return handleServiceError(error, set);
            }
        },
        {
            checkAuth: ['user'],
            detail: {
                tags: ['Cart'],
                summary: 'Lấy giỏ hàng của user hiện tại',
                security: [{JwtAuth: []}],
                description: 'Lấy toàn bộ giỏ hàng với chi tiết sản phẩm'
            }
        }
    )

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    .put(
        "/update",
        async ({body, user, cartService, set}) => {
            try {
                const result = await cartService.updateCartItem({
                    userId: user._id,
                    productId: body.productId,
                    quantity: body.quantity
                });
                return result;
            } catch (error: any) {
                return handleServiceError(error, set);
            }
        },
        {
            checkAuth: ['user'],
            body: UpdateCartItemBodySchema,
            detail: {
                tags: ['Cart'],
                summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng',
                security: [{JwtAuth: []}],
                description: 'Cập nhật số lượng của một sản phẩm trong giỏ hàng'
            }
        }
    )

    // Xóa sản phẩm khỏi giỏ hàng
    .delete(
        "/remove/:productId",
        async ({params, user, cartService, set}) => {
            try {
                const result = await cartService.removeFromCart(
                    user._id,
                    params.productId
                );
                return result;
            } catch (error: any) {
                return handleServiceError(error, set);
            }
        },
        {
            checkAuth: ['user'],
            params: ProductIdParamsSchema,
            detail: {
                tags: ['Cart'],
                summary: 'Xóa sản phẩm khỏi giỏ hàng',
                security: [{JwtAuth: []}],
                description: 'Xóa một sản phẩm khỏi giỏ hàng'
            }
        }
    )

    // Xóa toàn bộ giỏ hàng
    .delete(
        "/clear",
        async ({user, cartService, set}) => {
            try {
                return await cartService.clearCart(user._id);
            } catch (error: any) {
                return handleServiceError(error, set);
            }
        },
        {
            checkAuth: ['user'],
            detail: {
                tags: ['Cart'],
                summary: 'Xóa toàn bộ giỏ hàng',
                security: [{JwtAuth: []}],
                description: 'Xóa tất cả sản phẩm trong giỏ hàng'
            }
        }
    );

export default cartController;