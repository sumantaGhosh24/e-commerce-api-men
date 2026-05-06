import request from "supertest";

import app from "../../src/app";
import * as brandService from "../../src/services/brand.service";

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
jest.mock("../../src/services/brand.service");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../src/middleware/admin.middleware", () =>
  jest.fn((req, res, next) => next())
);

describe("Brand Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/brand", () => {
    it("should return all brands", async () => {
      (brandService.getBrandsService as jest.Mock).mockResolvedValue([
        { name: "Nike" },
      ]);

      const res = await request(app).get("/api/brand").expect(200);

      expect(res.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "Nike" })])
      );
    });

    it("should return 500 if service fails", async () => {
      (brandService.getBrandsService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = await request(app).get("/api/brand").expect(500);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("POST /api/brand", () => {
    it("should create brand successfully", async () => {
      (brandService.createBrandService as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post("/api/brand")
        .send({
          name: "Nike",
          image: { url: "img.jpg", public_id: "1" },
        })
        .expect(200);

      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app).post("/api/brand").send({}).expect(400);

      expect(res.body).toHaveProperty("error");
    });

    it("should return 500 if service throws error", async () => {
      (brandService.createBrandService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = await request(app)
        .post("/api/brand")
        .send({
          name: "Nike",
          image: { url: "img.jpg", public_id: "1" },
        })
        .expect(500);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("GET /api/brand/:id", () => {
    it("should return brand successfully", async () => {
      (brandService.getBrandService as jest.Mock).mockResolvedValue({
        name: "Nike",
      });

      const res = await request(app).get("/api/brand/1").expect(200);

      expect(res.body).toEqual(expect.objectContaining({ name: "Nike" }));
    });

    it("should return 500 if service throws error", async () => {
      (brandService.getBrandService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = await request(app).get("/api/brand/1").expect(500);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/brand/:id", () => {
    it("should update brand successfully", async () => {
      (brandService.updateBrandService as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .put("/api/brand/1")
        .send({
          name: "Adidas",
          image: { url: "img.jpg", public_id: "1" },
        })
        .expect(200);

      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app).put("/api/brand/1").send({}).expect(400);

      expect(res.body).toHaveProperty("error");
    });

    it("should return 500 if service throws error", async () => {
      (brandService.updateBrandService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = await request(app)
        .put("/api/brand/1")
        .send({
          name: "Adidas",
          image: { url: "img.jpg", public_id: "1" },
        })
        .expect(500);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("DELETE /api/brand/:id", () => {
    it("should delete brand successfully", async () => {
      (brandService.deleteBrandService as jest.Mock).mockResolvedValue({});

      const res = await request(app).delete("/api/brand/1").expect(200);

      expect(res.body).toHaveProperty("message");
    });

    it("should return 500 if service throws error", async () => {
      (brandService.deleteBrandService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = await request(app).delete("/api/brand/1").expect(500);

      expect(res.body).toHaveProperty("message");
    });
  });
});
