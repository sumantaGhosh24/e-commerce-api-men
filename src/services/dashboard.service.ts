import User, { IUser } from "../models/user.model";
import Product, { IProduct } from "../models/product.model";
import Order, { IOrder } from "../models/order.model";
import Review, { IReview } from "../models/review.model";
import Category, { ICategory } from "../models/category.model";
import redisClient from "../config/redis";
import { CACHE_KEYS } from "../config/cacheKeys";
import logger from "../config/logger";

const CACHE_TTL = 60 * 10;

export const getAdminDashboardService = async () => {
  try {
    const cacheKey = CACHE_KEYS.ADMIN_DASHBOARD;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });
    const totalProduct = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalCategories = await Category.countDocuments();

    const recentUsers: IUser[] = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);
    const recentProducts: IProduct[] = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("owner")
      .populate("category");
    const recentOrders: IOrder[] = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user")
      .populate("product");
    const recentReviews: IReview[] = await Review.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user")
      .populate("product");
    const recentCategories: ICategory[] = await Category.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const totalOrderPrice = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);
    const totalRevenue = totalOrderPrice[0]?.total || 0;

    const dashboardData = {
      totalUsers,
      activeUsers,
      totalProduct,
      totalOrders,
      totalReviews,
      totalCategories,
      recentUsers,
      recentProducts,
      recentOrders,
      recentReviews,
      recentCategories,
      totalRevenue,
    };

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(dashboardData));

    return dashboardData;
  } catch (error) {
    logger.error("Error getting admin dashboard", error);

    throw error;
  }
};

export const getUserDashboardService = async (userId: string) => {
  try {
    const cacheKey = CACHE_KEYS.USER_DASHBOARD(userId);

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const userOrders: IOrder[] = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("product");
    const userReviews: IReview[] = await Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("product");

    const totalOrdersByUser = await Order.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]);

    const totalOrderPriceByUser = await Order.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const dashboardData = {
      user,
      userOrders,
      userReviews,
      totalOrders: totalOrdersByUser[0]?.total || 0,
      totalOrderPrice: totalOrderPriceByUser[0]?.total || 0,
    };

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(dashboardData));

    return dashboardData;
  } catch (error) {
    logger.error("Error getting user dashboard", error);

    throw error;
  }
};
