import {Elysia} from "elysia";
import {RequestContext} from "@mikro-orm/core";
import {Cart} from "../entities/Cart";
import {CartItem} from "../entities/CartItem";
import {Product} from "../entities/Product";
import {User} from "../entities/User";
import {ProductStatus} from "../enums/ProductStatus.enum";

export interface AddToCartData {
    userId: string;
    productId: string;
    quantity: number;
}

export interface UpdateCartItemData {
    userId: string;
    productId: string;
    quantity: number;
}

const cartService = new Elysia({name: 'cartService'})
    .decorate({
        cartService: {
            // Lấy hoặc tạo giỏ hàng cho user
            async getOrCreateCart(userId: string): Promise<Cart> {
                const em: any = RequestContext.getEntityManager()!;

                // Tìm giỏ hàng hiện tại
                let cart = await em.findOne(Cart,
                    {user: userId},
                    {populate: ['items', 'items.product', 'user']}
                );

                if (!cart) {
                    // Tạo giỏ hàng mới nếu chưa có
                    const user = await em.findOne(User, {_id: userId});
                    if (!user) {
                        throw new Error("User not found");
                    }

                    cart = new Cart();
                    cart.user = user;
                    em.persist(cart);
                    await em.flush();
                }

                return cart;
            },

            // Thêm sản phẩm vào giỏ hàng
            async addToCart(data: AddToCartData): Promise<Cart> {
                const em = RequestContext.getEntityManager()!;
                const {userId, productId, quantity} = data;

                // Kiểm tra sản phẩm có tồn tại và còn hàng không
                const product = await em.findOne(Product, {_id: productId});
                if (!product) {
                    throw new Error("Product not found");
                }

                if (product.status !== ProductStatus.IN_STOCK) {
                    throw new Error("Product is out of stock");
                }

                if (product.quantity < quantity) {
                    throw new Error(`Only ${product.quantity} items available in stock`);
                }

                // Lấy hoặc tạo giỏ hàng
                const cart = await this.getOrCreateCart(userId);

                // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
                let cartItem = await em.findOne(CartItem, {
                    cart: cart._id,
                    product: productId
                });

                if (cartItem) {
                    // Nếu đã có, cập nhật số lượng
                    const newQuantity = cartItem.quantity + quantity;
                    if (product.quantity < newQuantity) {
                        throw new Error(`Only ${product.quantity} items available in stock`);
                    }

                    cartItem.quantity = newQuantity;
                    cartItem.totalPrice = cartItem.price * newQuantity;
                } else {
                    // Nếu chưa có, tạo mới
                    cartItem = new CartItem();
                    cartItem.cart = cart;
                    cartItem.product = product;
                    cartItem.quantity = quantity;
                    cartItem.price = product.price;
                    cartItem.totalPrice = product.price * quantity;
                    em.persist(cartItem);
                }

                // Cập nhật tổng giỏ hàng
                await this.updateCartTotals(cart);
                await em.flush();

                return await this.getCartByUserId(userId);
            },

            // Xóa sản phẩm khỏi giỏ hàng
            async removeFromCart(userId: string, productId: string): Promise<Cart> {
                const em = RequestContext.getEntityManager()!;
                const cart = await this.getOrCreateCart(userId);

                const cartItem = await em.findOne(CartItem, {
                    cart: cart._id,
                    product: productId
                });

                if (!cartItem) {
                    throw new Error("Product not found in cart");
                }

                em.remove(cartItem);
                await this.updateCartTotals(cart);
                await em.flush();

                return await this.getCartByUserId(userId);
            },

            // Cập nhật số lượng sản phẩm trong giỏ hàng
            async updateCartItem(data: UpdateCartItemData): Promise<Cart> {
                const em = RequestContext.getEntityManager()!;
                const {userId, productId, quantity} = data;

                if (quantity <= 0) {
                    return await this.removeFromCart(userId, productId);
                }

                const cart = await this.getOrCreateCart(userId);

                const cartItem = await em.findOne(CartItem, {
                    cart: cart._id,
                    product: productId
                }, {populate: ['product']});

                if (!cartItem) {
                    throw new Error("Product not found in cart");
                }

                // Kiểm tra tồn kho
                if (cartItem.product.quantity < quantity) {
                    throw new Error(`Only ${cartItem.product.quantity} items available in stock`);
                }

                cartItem.quantity = quantity;
                cartItem.totalPrice = cartItem.price * quantity;

                await this.updateCartTotals(cart);
                await em.flush();

                return await this.getCartByUserId(userId);
            },

            // Lấy giỏ hàng của user
            async getCartByUserId(userId: string): Promise<Cart> {
                const em = RequestContext.getEntityManager()!;
                const cart = await em.findOne(Cart,
                    {user: userId},
                    {
                        populate: [
                            'items',
                            'items.product',
                            'items.product.category',
                            'user'
                        ]
                    }
                );

                if (!cart) {
                    // Tạo giỏ hàng trống nếu chưa có
                    return await this.getOrCreateCart(userId);
                }

                return cart;
            },

            // Xóa toàn bộ giỏ hàng
            async clearCart(userId: string): Promise<{ message: string }> {
                const em = RequestContext.getEntityManager()!;
                const cart = await em.findOne(Cart,
                    {user: userId},
                    {populate: ['items']}
                );

                if (!cart) {
                    throw new Error("Cart not found");
                }

                // Xóa tất cả items trong giỏ hàng
                for (const item of cart.items) {
                    em.remove(item);
                }

                cart.totalAmount = 0;
                cart.totalItems = 0;

                await em.flush();

                return {message: "Cart cleared successfully"};
            },

            // Cập nhật tổng tiền và số lượng của giỏ hàng
            async updateCartTotals(cart: Cart): Promise<void> {
                const em = RequestContext.getEntityManager()!;
                const cartItems = await em.find(CartItem, {cart: cart._id});

                cart.totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
                cart.totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            }
        }
    });

export default cartService;