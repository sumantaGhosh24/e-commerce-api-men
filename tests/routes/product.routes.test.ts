import request from "supertest";

import app from "../../src/app";
import * as productService from "../../src/services/product.service";

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
jest.mock("../../src/middleware/admin.middleware", () =>
  jest.fn((_req, _res, next) => next())
);
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../src/services/product.service");

const mockProduct = {
  _id: "1",
  title: "Test Product",
  price: 100,
};

describe("Product Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/products", () => {
    it("should get all products", async () => {
      (productService.getProductsService as jest.Mock).mockResolvedValue({
        products: [mockProduct],
        count: 1,
      });

      const res = await request(app).get("/api/products").expect(200);

      expect(res.body).toHaveProperty("products");
      expect(res.body).toHaveProperty("count", 1);
    });
  });

  describe("GET /api/product/:id", () => {
    it("should get single product", async () => {
      (productService.getProductService as jest.Mock).mockResolvedValue(
        mockProduct
      );

      const res = await request(app).get("/api/product/1").expect(200);

      expect(res.body).toHaveProperty("_id", "1");
    });
  });

  describe("POST /api/product", () => {
    it("should create product (admin)", async () => {
      (productService.createProductService as jest.Mock).mockResolvedValue(
        mockProduct
      );

      const res = await request(app)
        .post("/api/product")
        .send({
          title: "Test Product",
          description: "Test description",
          content: "Test content",
          category: "cat123",
          brand: "brand123",
          price: 100,
          checked: false,
          stock: 10,
          sold: 0,
          images: [
            {
              url: "http://image.com",
              public_id: "img1",
            },
          ],
        })
        .expect(200);

      expect(res.body).toHaveProperty(
        "message",
        "Product created successfully."
      );
    });
  });

  describe("PUT /api/product/:id", () => {
    it("should update product", async () => {
      (productService.updateProductService as jest.Mock).mockResolvedValue(
        mockProduct
      );

      const res = await request(app)
        .put("/api/product/1")
        .send({
          title: "Updated",
          description: "Updated desc",
          content: "Updated content",
          category: "cat123",
          brand: "brand123",
          price: 200,
          checked: true,
          stock: 5,
          sold: 1,
        })
        .expect(200);

      expect(res.body).toHaveProperty(
        "message",
        "Product updated successfully."
      );
    });
  });

  describe("PATCH /api/add-images/:id", () => {
    it("should add images", async () => {
      (productService.addImagesService as jest.Mock).mockResolvedValue(
        mockProduct
      );

      const res = await request(app)
        .patch("/api/add-images/1")
        .send({
          images: [
            {
              url: "http://image.com",
              public_id: "img1",
            },
          ],
        })
        .expect(200);

      expect(res.body).toHaveProperty("message", "Image added successfully.");
    });
  });

  describe("PATCH /api/remove-images/:id", () => {
    it("should remove images", async () => {
      (productService.removeImagesService as jest.Mock).mockResolvedValue(
        mockProduct
      );

      const res = await request(app)
        .patch("/api/remove-images/1")
        .send({
          public_id: "img1",
        })
        .expect(200);

      expect(res.body).toHaveProperty("message", "Image removed successfully.");
    });
  });

  describe("DELETE /api/product/:id", () => {
    it("should delete product", async () => {
      (productService.deleteProductService as jest.Mock).mockResolvedValue(
        true
      );

      const res = await request(app).delete("/api/product/1").expect(200);

      expect(res.body).toHaveProperty(
        "message",
        "Product deleted successfully."
      );
    });
  });
});
