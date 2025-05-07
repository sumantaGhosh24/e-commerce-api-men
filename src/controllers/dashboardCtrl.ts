import {Request, Response} from "express";

import User, {IUser} from "../models/userModel";
import Product, {IProduct} from "../models/productModel";
import Order, {IOrder} from "../models/orderModel";
import Review, {IReview} from "../models/reviewModel";
import Category, {ICategory} from "../models/categoryModel";
import {IReqAuth} from "../types";

const dashboardCtrl = {
  getAdminDashboard: async (req: Request, res: Response) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({status: "active"});
      const totalProduct = await Product.countDocuments();
      const totalOrders = await Order.countDocuments();
      const totalReviews = await Review.countDocuments();
      const totalCategories = await Category.countDocuments();

      const recentUsers: IUser[] = await User.find()
        .sort({createdAt: -1})
        .limit(5);
      const recentProducts: IProduct[] = await Product.find()
        .sort({createdAt: -1})
        .limit(5)
        .populate("owner")
        .populate("category");
      const recentOrders: IOrder[] = await Order.find()
        .sort({createdAt: -1})
        .limit(5)
        .populate("user")
        .populate("product");
      const recentReviews: IReview[] = await Review.find()
        .sort({createdAt: -1})
        .limit(5)
        .populate("user")
        .populate("product");
      const recentCategories: ICategory[] = await Category.find()
        .sort({createdAt: -1})
        .limit(5);

      const totalOrderPrice = await Order.aggregate([
        {
          $group: {
            _id: null,
            total: {$sum: "$totalPrice"},
          },
        },
      ]);
      const totalRevenue = totalOrderPrice[0]?.total || 0;

      res.status(200).json({
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
      });
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  getDashboard: async (req: IReqAuth, res: Response) => {
    try {
      const userId = req.user?._id;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const userOrders: IOrder[] = await Order.find({user: userId})
        .sort({createdAt: -1})
        .populate("product");
      const userReviews: IReview[] = await Review.find({user: userId})
        .sort({createdAt: -1})
        .populate("product");

      const totalOrdersByUser = await Order.aggregate([
        {$match: {user: userId}},
        {$group: {_id: null, total: {$sum: 1}}},
      ]);

      const totalOrderPriceByUser = await Order.aggregate([
        {$match: {user: userId}},
        {$group: {_id: null, total: {$sum: "$totalPrice"}}},
      ]);

      res.status(200).json({
        user,
        userOrders,
        userReviews,
        totalOrders: totalOrdersByUser[0]?.total || 0,
        totalOrderPrice: totalOrderPriceByUser[0]?.total || 0,
      });
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
};

export default dashboardCtrl;
