import Cart from "../models/cart.model";
import Product from "../models/product.model";
import redisClient from "../config/redis";
import { CACHE_KEYS } from "../config/cacheKeys";
import logger from "../config/logger";

const CACHE_TTL = 60 * 10;

export const getCartService = async (userId: string) => {
  try {
    const cacheKey = CACHE_KEYS.USER_CART(userId);
    const cachedCart = await redisClient.get(cacheKey);

    if (cachedCart) {
      return JSON.parse(cachedCart);
    }

    const cart = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(cart));

    return cart;
  } catch (error) {
    logger.error("Error to get cart", error);

    throw error;
  }
};

export const addCartService = async ({
  userId,
  productId,
  quantity,
}: {
  userId: string;
  productId: string;
  quantity: number;
}) => {
  try {
    const cart = await Cart.findOne({ user: userId });

    const product = await Product.findById(productId).select("price");
    if (!product) {
      return { message: "Product not found.", error: "NOT_FOUND" };
    }

    const price = Number(product.price);
    const taxPrice = (10 / 100) * price;
    const shippingPrice = (5 / 100) * price;
    const totalPrice = price + taxPrice + shippingPrice;

    if (cart) {
      const productIndex = cart.products.findIndex(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.product == productId
      );

      if (productIndex > -1) {
        const productItem = cart.products[productIndex];
        productItem.quantity = quantity;
        productItem.price = price * quantity;
        productItem.taxPrice = (10 / 100) * productItem.price;
        productItem.shippingPrice = (5 / 100) * productItem.price;
        productItem.totalPrice =
          productItem.price + productItem.taxPrice + productItem.shippingPrice;
        cart.products[productIndex] = productItem;
      } else {
        cart.products.push({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          product: productId as any,
          quantity,
          price,
          taxPrice,
          shippingPrice,
          totalPrice,
        });
      }

      await cart.save();
    } else {
      await Cart.create({
        user: userId,
        products: [
          {
            product: productId,
            quantity,
            price,
            taxPrice,
            shippingPrice,
            totalPrice,
          },
        ],
      });
    }

    await redisClient.del(CACHE_KEYS.USER_CART(userId));

    return cart;
  } catch (error) {
    logger.error("Error to add product to cart", error);

    throw error;
  }
};

export const removeCartService = async ({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) => {
  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return { message: "Cart does not exists.", error: "NOT_FOUND" };
    }

    const productIndex = cart.products.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.product == productId
    );

    if (productIndex > -1) {
      cart.products.splice(productIndex, 1);
    }

    await cart.save();
    await redisClient.del(CACHE_KEYS.USER_CART(userId));

    return cart;
  } catch (error) {
    logger.error("Error to remove product from cart", error);

    throw error;
  }
};

export const clearCartService = async (userId: string) => {
  try {
    await Cart.findOneAndDelete({ user: userId });
    await redisClient.del(CACHE_KEYS.USER_CART(userId));

    return true;
  } catch (error) {
    logger.error("Error to clear cart", error);

    throw error;
  }
};
