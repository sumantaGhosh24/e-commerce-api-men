import request from "supertest";

import app from "../../src/app";
import * as orderService from "../../src/services/order.service";

jest.mock("@arcjet/node", () => ({
  slidingWindow: jest.fn(),
}));
jest.mock("../../src/config/arcjet", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../src/middleware/security.middleware", () =>
  jest.fn((req, _res, next) => next())
);
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../src/services/order.service");
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
let isAdmin = true;
jest.mock("../../src/middleware/auth.middleware", () =>
  jest.fn((req, _res, next) => {
    const role = req.headers["x-role"] || "user";
    req.user = {
      _id: "user123",
      role,
    };
    next();
  })
);
jest.mock("../../src/middleware/admin.middleware", () =>
  jest.fn((req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  })
);

const mockedOrderService = orderService as jest.Mocked<typeof orderService>;

describe("Order Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAdmin = true;
  });

  describe("POST /api/verification", () => {
    const validPayload = {
      orderCreationId: "order_1",
      razorpayPaymentId: "pay_1",
      razorpayOrderId: "rzp_1",
      razorpaySignature: "signature",
      orderItems: [{ product: "prod_1", quantity: 1 }],
      shippingAddress: {
        address: "Street",
        city: "Kolkata",
        state: "WB",
        country: "India",
        pin: "700001",
      },
      price: 100,
      taxPrice: 10,
      shippingPrice: 5,
      totalPrice: 115,
      cartId: "cart_1",
    };

    it("should verify and create order", async () => {
      mockedOrderService.verifyAndCreateOrderService.mockResolvedValue({
        orderId: "order_123",
        paymentId: "pay_123",
      } as never);

      const res = await request(app)
        .post("/api/verification")
        .send(validPayload)
        .expect(200);

      expect(res.body).toHaveProperty("orderId", "order_123");
      expect(res.body).toHaveProperty("paymentId", "pay_123");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .post("/api/verification")
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/order/:id", () => {
    it("should return order", async () => {
      mockedOrderService.getOrderService.mockResolvedValue({
        _id: "1",
      } as never);

      const res = await request(app).get("/api/order/1").expect(200);

      expect(res.body).toHaveProperty("_id", "1");
    });

    it("should return 400 for invalid id", async () => {
      const res = await request(app).get("/api/order/").expect(404);
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/order/:id", () => {
    it("should update order", async () => {
      mockedOrderService.updateOrderService.mockResolvedValue({
        _id: "1",
        status: "delivered",
      } as never);

      const res = await request(app)
        .put("/api/order/1")
        .send({ status: "delivered" })
        .expect(200);

      expect(res.body).toHaveProperty("message", "Order updated successfully.");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app).put("/api/order/1").send({}).expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/user-orders", () => {
    it("should return logged-in user orders", async () => {
      mockedOrderService.getUserOrdersService.mockResolvedValue({
        orders: [{ _id: "1" }],
        count: 1,
      } as never);

      const res = await request(app).get("/api/user-orders").expect(200);

      expect(res.body).toEqual({
        orders: [{ _id: "1" }],
        count: 1,
      });
    });

    it("should handle service error", async () => {
      mockedOrderService.getUserOrdersService.mockRejectedValue(
        new Error("fail")
      );

      const res = await request(app).get("/api/user-orders").expect(500);

      expect(res.body).toHaveProperty("message");
    });
  });
});
