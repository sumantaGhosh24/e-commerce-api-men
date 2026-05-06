import { Request, Response } from "express";

import * as dashboardController from "../../src/controllers/dashboard.controller";
import * as dashboardService from "../../src/services/dashboard.service";
import { IReqAuth } from "../../src/types";
import { IUser } from "../../src/models/user.model";

jest.mock("../../src/services/dashboard.service");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (data: Partial<Request>): Request => data as Request;

const mockAuthRequest = (user?: Partial<IUser>): IReqAuth =>
  ({
    user,
  }) as unknown as IReqAuth;

describe("Dashboard Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAdminDashboard", () => {
    it("should return admin dashboard data", async () => {
      const mockData = {
        totalUsers: 10,
        activeUsers: 5,
        totalProduct: 20,
        totalOrders: 15,
        totalReviews: 8,
        totalCategories: 6,
        recentUsers: [],
        recentProducts: [],
        recentOrders: [],
        recentReviews: [],
        recentCategories: [],
        totalRevenue: 1000,
      };

      (
        dashboardService.getAdminDashboardService as jest.Mock
      ).mockResolvedValue(mockData);

      const req = mockRequest({});
      const res = mockResponse();

      await dashboardController.getAdminDashboard(req, res);

      expect(dashboardService.getAdminDashboardService).toHaveBeenCalledTimes(
        1
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle service error", async () => {
      (
        dashboardService.getAdminDashboardService as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      const req = mockRequest({});
      const res = mockResponse();

      await dashboardController.getAdminDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error",
      });
    });

    it("should handle non-Error thrown", async () => {
      (
        dashboardService.getAdminDashboardService as jest.Mock
      ).mockRejectedValue("Something went wrong");

      const req = mockRequest({});
      const res = mockResponse();

      await dashboardController.getAdminDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });

  describe("getDashboard", () => {
    it("should return user dashboard data", async () => {
      const mockData = {
        user: { name: "John" },
        userOrders: [],
        userReviews: [],
        totalOrders: 3,
        totalOrderPrice: 500,
      };

      (dashboardService.getUserDashboardService as jest.Mock).mockResolvedValue(
        mockData
      );

      const req = mockAuthRequest({ _id: "user1" });
      const res = mockResponse();

      await dashboardController.getDashboard(req, res);

      expect(dashboardService.getUserDashboardService).toHaveBeenCalledWith(
        "user1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle missing user id", async () => {
      (dashboardService.getUserDashboardService as jest.Mock).mockRejectedValue(
        new Error("User not found")
      );
      const req = mockAuthRequest();
      const res = mockResponse();

      await dashboardController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle service error", async () => {
      (dashboardService.getUserDashboardService as jest.Mock).mockRejectedValue(
        new Error("Error")
      );

      const req = mockAuthRequest({ _id: "user1" });
      const res = mockResponse();

      await dashboardController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error",
      });
    });

    it("should handle non-Error thrown", async () => {
      (dashboardService.getUserDashboardService as jest.Mock).mockRejectedValue(
        "Failure"
      );

      const req = mockAuthRequest({ _id: "user1" });
      const res = mockResponse();

      await dashboardController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failure",
      });
    });
  });
});
