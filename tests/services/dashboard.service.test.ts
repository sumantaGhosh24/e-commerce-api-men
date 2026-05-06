import * as dashboardService from "../../src/services/dashboard.service";
import redisClient from "../../src/config/redis";
import User from "../../src/models/user.model";
import Product from "../../src/models/product.model";
import Order from "../../src/models/order.model";
import Review from "../../src/models/review.model";
import Category from "../../src/models/category.model";

jest.mock("../../src/config/redis");
jest.mock("../../src/models/user.model");
jest.mock("../../src/models/product.model");
jest.mock("../../src/models/order.model");
jest.mock("../../src/models/review.model");
jest.mock("../../src/models/category.model");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("Dashboard Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAdminDashboardService", () => {
    it("should return cached data if exists", async () => {
      const cached = { totalUsers: 1 };

      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(cached));

      const result = await dashboardService.getAdminDashboardService();

      expect(result).toEqual(cached);
      expect(redisClient.get).toHaveBeenCalled();
    });

    it("should fetch data from DB if no cache", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      (User.countDocuments as jest.Mock).mockResolvedValue(10);
      (Product.countDocuments as jest.Mock).mockResolvedValue(5);
      (Order.countDocuments as jest.Mock).mockResolvedValue(3);
      (Review.countDocuments as jest.Mock).mockResolvedValue(2);
      (Category.countDocuments as jest.Mock).mockResolvedValue(1);

      (User.find as jest.Mock).mockReturnValue({
        sort: () => ({
          limit: () => [],
        }),
      });

      (Product.find as jest.Mock).mockReturnValue({
        sort: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => [],
            }),
          }),
        }),
      });

      (Order.find as jest.Mock).mockReturnValue({
        sort: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => [],
            }),
          }),
        }),
      });

      (Review.find as jest.Mock).mockReturnValue({
        sort: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => [],
            }),
          }),
        }),
      });

      (Category.find as jest.Mock).mockReturnValue({
        sort: () => ({
          limit: () => [],
        }),
      });

      (Order.aggregate as jest.Mock).mockResolvedValue([{ total: 100 }]);

      const result = await dashboardService.getAdminDashboardService();

      expect(result.totalUsers).toBe(10);
      expect(result.totalRevenue).toBe(100);
      expect(redisClient.setEx).toHaveBeenCalled();
    });
  });

  describe("getUserDashboardService", () => {
    it("should return cached data", async () => {
      const cached = { totalOrders: 2 };

      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(cached));

      const result = await dashboardService.getUserDashboardService("user1");

      expect(result).toEqual(cached);
    });

    it("should throw if user not found", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        dashboardService.getUserDashboardService("user1")
      ).rejects.toThrow("User not found");
    });

    it("should return user dashboard data", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      (User.findById as jest.Mock).mockResolvedValue({ _id: "user1" });

      (Order.find as jest.Mock).mockReturnValue({
        sort: () => ({
          populate: () => [],
        }),
      });

      (Review.find as jest.Mock).mockReturnValue({
        sort: () => ({
          populate: () => [],
        }),
      });

      (Order.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ total: 2 }])
        .mockResolvedValueOnce([{ total: 200 }]);

      const result = await dashboardService.getUserDashboardService("user1");

      expect(result.totalOrders).toBe(2);
      expect(result.totalOrderPrice).toBe(200);
      expect(redisClient.setEx).toHaveBeenCalled();
    });
  });
});
