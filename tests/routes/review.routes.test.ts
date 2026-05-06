import request from "supertest";

import app from "../../src/app";
import * as reviewService from "../../src/services/review.service";

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
    req.user = { _id: "u1" };
    next();
  })
);
jest.mock("../../src/middleware/admin.middleware", () =>
  jest.fn((_req, _res, next) => next())
);
jest.mock("../../src/services/review.service");

const mockReview = {
  _id: "r1",
  comment: "good",
  rating: 5,
  user: "u1",
  product: "p1",
};

describe("Review Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/reviews", () => {
    it("should get all reviews", async () => {
      (reviewService.getReviewsService as jest.Mock).mockResolvedValue({
        reviews: [mockReview],
        count: 1,
      });

      const res = await request(app).get("/api/reviews").expect(200);

      expect(res.body).toHaveProperty("reviews");
      expect(res.body).toHaveProperty("count");
    });
  });

  describe("GET /api/review/:product", () => {
    it("should get reviews by product", async () => {
      (reviewService.getProductReviewsService as jest.Mock).mockResolvedValue([
        mockReview,
      ]);

      const res = await request(app).get("/api/review/1").expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/review/user/:user", () => {
    it("should get reviews by user", async () => {
      (reviewService.getUserReviewsService as jest.Mock).mockResolvedValue([
        mockReview,
      ]);

      const res = await request(app).get("/api/review/user/1").expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/review/:product", () => {
    it("should create review successfully", async () => {
      (reviewService.createReviewService as jest.Mock).mockResolvedValue(
        mockReview
      );

      const res = await request(app)
        .post("/api/review/1")
        .send({
          product: "1",
          comment: "good",
          rating: 5,
        })
        .expect(200);

      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app).post("/api/review/1").send({}).expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });
});
