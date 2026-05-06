import request from "supertest";

import app from "../../src/app";
import * as dashboardService from "../../src/services/dashboard.service";

jest.mock("@arcjet/node", () => ({
  slidingWindow: jest.fn(),
}));
jest.mock("../../src/config/arcjet", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../src/middleware/security.middleware", () =>
  jest.fn((req, res, next) => next())
);
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../src/middleware/auth.middleware", () => {
  return jest.fn((req, _res, next) => {
    req.user = { _id: "user123", role: "user" };
    next();
  });
});
jest.mock("../../src/middleware/admin.middleware", () => {
  return jest.fn((req, _res, next) => {
    req.user = { _id: "admin123", role: "admin" };
    next();
  });
});
jest.mock("../../src/services/dashboard.service");

describe("Dashboard Routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/dashboard", () => {
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

      const res = await request(app).get("/api/admin/dashboard");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData);
      expect(dashboardService.getAdminDashboardService).toHaveBeenCalledTimes(
        1
      );
    });

    it("should handle service error", async () => {
      (
        dashboardService.getAdminDashboardService as jest.Mock
      ).mockRejectedValue(new Error("Admin error"));

      const res = await request(app).get("/api/admin/dashboard");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Admin error",
      });
    });

    it("should handle non-Error thrown", async () => {
      (
        dashboardService.getAdminDashboardService as jest.Mock
      ).mockRejectedValue("Something failed");

      const res = await request(app).get("/api/admin/dashboard");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Something failed",
      });
    });
  });

  describe("GET /api/dashboard", () => {
    it("should return user dashboard data", async () => {
      const mockData = {
        user: { _id: "user123" },
        userOrders: [],
        userReviews: [],
        totalOrders: 2,
        totalOrderPrice: 500,
      };

      (dashboardService.getUserDashboardService as jest.Mock).mockResolvedValue(
        mockData
      );

      const res = await request(app).get("/api/dashboard");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData);
      expect(dashboardService.getUserDashboardService).toHaveBeenCalledWith(
        "user123"
      );
    });

    it("should handle service error", async () => {
      (dashboardService.getUserDashboardService as jest.Mock).mockRejectedValue(
        new Error("User error")
      );

      const res = await request(app).get("/api/dashboard");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "User error",
      });
    });

    it("should handle non-Error thrown", async () => {
      (dashboardService.getUserDashboardService as jest.Mock).mockRejectedValue(
        "Failure"
      );

      const res = await request(app).get("/api/dashboard");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failure",
      });
    });

    it("should call service with injected user id from middleware", async () => {
      const mockData = {
        user: { _id: "user123" },
      };

      (dashboardService.getUserDashboardService as jest.Mock).mockResolvedValue(
        mockData
      );

      await request(app).get("/api/dashboard");

      expect(dashboardService.getUserDashboardService).toHaveBeenCalledWith(
        "user123"
      );
    });
  });
});
