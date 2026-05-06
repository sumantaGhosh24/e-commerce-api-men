import request from "supertest";

import app from "../../src/app";
import * as cartService from "../../src/services/cart.service";

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
jest.mock("../../src/middleware/auth.middleware", () =>
  jest.fn((req, _res, next) => {
    req.user = { _id: "user123" };
    next();
  })
);
jest.mock("../../src/services/cart.service");

describe("Cart Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/cart", () => {
    it("should return cart successfully", async () => {
      (cartService.getCartService as jest.Mock).mockResolvedValue({
        user: "user123",
        products: [],
      });

      const res = await request(app).get("/api/cart").expect(200);

      expect(res.body).toHaveProperty("products");
    });
  });

  describe("POST /api/cart/add", () => {
    it("should add product successfully", async () => {
      (cartService.addCartService as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/cart/add")
        .send({
          productId: "prod1",
          quantity: 2,
        })
        .expect(200);

      expect(res.body).toHaveProperty("message", "Product added to cart.");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .post("/api/cart/add")
        .send({
          productId: "",
          quantity: 0,
        })
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/cart/remove", () => {
    it("should remove product successfully", async () => {
      (cartService.removeCartService as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/cart/remove")
        .send({ productId: "prod1" })
        .expect(200);

      expect(res.body).toHaveProperty("message", "Product removed from cart.");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .post("/api/cart/remove")
        .send({ productId: "" })
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/cart/clear", () => {
    it("should clear cart successfully", async () => {
      (cartService.clearCartService as jest.Mock).mockResolvedValue(true);

      const res = await request(app).post("/api/cart/clear").expect(200);

      expect(res.body).toHaveProperty("message", "Cart cleared.");
    });
  });
});
