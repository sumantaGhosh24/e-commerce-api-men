import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";

import { APIFeatures } from "../utils/pagination";
import Order, { IOrder } from "../models/order.model";
import Cart from "../models/cart.model";
import redisClient from "../config/redis";
import { CACHE_KEYS } from "../config/cacheKeys";
import logger from "../config/logger";

dotenv.config();

const CACHE_TTL = 60 * 10;

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const getRazorpayService = async (amount: number) => {
  try {
    const options = {
      amount: Number(amount * 100),
      currency: "INR",
    };

    const order = await instance.orders.create(options);

    return order;
  } catch (error) {
    logger.error("Error to create razorpay", error);

    throw error;
  }
};

export const verifyAndCreateOrderService = async ({
  orderCreationId,
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
  orderItems,
  shippingAddress,
  price,
  taxPrice,
  shippingPrice,
  totalPrice,
  cartId,
  userId,
}: {
  orderCreationId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  orderItems: {
    product: string;
    quantity: number;
  }[];
  shippingAddress: {
    address: string;
    city: string;
    pin: string;
    country: string;
    state: string;
  };
  price: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  cartId: string;
  userId: string;
}) => {
  try {
    const shasum = crypto.createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET!
    );
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");
    if (digest !== razorpaySignature) {
      throw new Error("Transaction not legit!");
    }

    const newOrder = new Order({
      user: userId,
      orderItems,
      shippingAddress,
      paymentResult: {
        id: orderCreationId,
        status: "success",
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      },
      price,
      taxPrice,
      shippingPrice,
      totalPrice,
    });
    await newOrder.save();

    await Cart.findByIdAndDelete(cartId);

    const keys = await redisClient.keys("orders:*");
    if (keys.length) await redisClient.del(keys);

    return {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
    };
  } catch (error) {
    logger.error("Error to create order", error);

    throw error;
  }
};

export const getOrdersService = async (
  query: Record<string, unknown>
): Promise<{ orders: IOrder[]; count: number }> => {
  try {
    const queryKey = JSON.stringify(query);
    const cacheKey = CACHE_KEYS.ORDERS(queryKey);

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const features = new APIFeatures(
      Order.find()
        .populate("user", "_id username email mobileNumber image")
        .populate("product"),
      query
    );
    const features2 = new APIFeatures(Order.find(), query);

    const result = await Promise.allSettled([features.query, features2.query]);

    const orders = result[0].status === "fulfilled" ? result[0].value : [];
    const count = result[1].status === "fulfilled" ? result[1].value.length : 0;

    const response = { orders, count };

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));

    return response;
  } catch (error) {
    logger.error("Error to get orders", error);

    throw error;
  }
};

export const getOrderService = async (orderId: string) => {
  try {
    const cacheKey = CACHE_KEYS.ORDER(orderId);

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const order = await Order.findById(orderId)
      .populate("user", "_id username email mobileNumber image")
      .populate("product");
    if (!order) {
      throw new Error("This order does not exists.");
    }

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(order));

    return order;
  } catch (error) {
    logger.error("Error to get order", error);

    throw error;
  }
};

export const updateOrderService = async (
  orderId: string,
  {
    status,
    isDeliverd,
    deliverAt,
  }: { status?: string; isDeliverd?: boolean; deliverAt?: string }
) => {
  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, isDeliverd, deliverAt },
      { new: true }
    );
    if (!order) {
      throw new Error("Order does not exists.");
    }

    await redisClient.del(CACHE_KEYS.ORDER(orderId));

    const keys = await redisClient.keys("orders:*");
    if (keys.length) await redisClient.del(keys);

    return order;
  } catch (error) {
    logger.error("Error to update order", error);

    throw error;
  }
};

export const getUserOrdersService = async (
  userId: string,
  query: Record<string, unknown>
): Promise<{ orders: IOrder[]; count: number }> => {
  try {
    const queryKey = JSON.stringify(query);

    const cacheKey = CACHE_KEYS.USER_ORDERS(userId, queryKey);

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const features = new APIFeatures(
      Order.find({ user: userId })
        .populate("user", "_id username email mobileNumber image")
        .populate("product"),
      query
    );
    const features2 = new APIFeatures(Order.find({ user: userId }), query);

    const result = await Promise.allSettled([features.query, features2.query]);

    const orders = result[0].status === "fulfilled" ? result[0].value : [];
    const count = result[1].status === "fulfilled" ? result[1].value.length : 0;

    const response = { orders, count };

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));

    return response;
  } catch (error) {
    logger.error("Error to get user orders", error);

    throw error;
  }
};
