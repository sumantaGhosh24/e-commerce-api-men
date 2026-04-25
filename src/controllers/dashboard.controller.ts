import { Request, Response } from "express";

import {
  getAdminDashboardService,
  getUserDashboardService,
} from "../services/dashboard.service";
import { IReqAuth } from "../types";
import logger from "../config/logger";

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const {
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
    } = await getAdminDashboardService();

    logger.info("Successfully fetched admin dashboard");

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
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getDashboard = async (req: IReqAuth, res: Response) => {
  try {
    const userId = req.user?._id as string;

    const { user, userOrders, userReviews, totalOrders, totalOrderPrice } =
      await getUserDashboardService(userId);

    logger.info(`Successfully fetched dashboard of user ${userId}`);

    res.status(200).json({
      user,
      userOrders,
      userReviews,
      totalOrders,
      totalOrderPrice,
    });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
