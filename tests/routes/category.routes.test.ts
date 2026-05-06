import request from "supertest";

import app from "../../src/app";
import * as categoryService from "../../src/services/category.service";
import * as validations from "../../src/validations/category.validation";

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
jest.mock("../../src/services/category.service");
jest.mock("../../src/validations/category.validation");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../src/middleware/admin.middleware", () =>
  jest.fn((_req, _res, next) => next())
);

describe("Category Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/category", () => {
    it("should return categories", async () => {
      (categoryService.getCategoriesService as jest.Mock).mockResolvedValue([
        { _id: "1", name: "electronics" },
      ]);

      const res = await request(app).get("/api/category").expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe("POST /api/category", () => {
    it("should create category successfully", async () => {
      (validations.createCategorySchema.safeParse as jest.Mock).mockReturnValue(
        {
          success: true,
          data: {
            name: "Electronics",
            image: { url: "img.jpg", public_id: "1" },
          },
        }
      );

      (categoryService.createCategoryService as jest.Mock).mockResolvedValue(
        undefined
      );

      const res = await request(app)
        .post("/api/category")
        .send({
          name: "Electronics",
          image: { url: "img.jpg", public_id: "1" },
        })
        .expect(200);

      expect(res.body).toHaveProperty(
        "message",
        "Category created successfully."
      );
    });

    it("should return 400 if validation fails", async () => {
      (validations.createCategorySchema.safeParse as jest.Mock).mockReturnValue(
        {
          success: false,
        }
      );

      const res = await request(app).post("/api/category").send({}).expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/category/:id", () => {
    it("should return category successfully", async () => {
      (validations.categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (categoryService.getCategoryService as jest.Mock).mockResolvedValue({
        _id: "1",
        name: "electronics",
      });

      const res = await request(app).get("/api/category/1").expect(200);

      expect(res.body).toHaveProperty("name");
    });

    it("should return 400 if validation fails", async () => {
      (validations.categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      const res = await request(app).get("/api/category/bad").expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/category/:id", () => {
    it("should update category successfully", async () => {
      (validations.categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (validations.updateCategorySchema.safeParse as jest.Mock).mockReturnValue(
        {
          success: true,
          data: {
            name: "Fashion",
            image: { url: "img.jpg", public_id: "1" },
          },
        }
      );

      (categoryService.updateCategoryService as jest.Mock).mockResolvedValue(
        undefined
      );

      const res = await request(app)
        .put("/api/category/1")
        .send({
          name: "Fashion",
          image: { url: "img.jpg", public_id: "1" },
        })
        .expect(200);

      expect(res.body).toHaveProperty(
        "message",
        "Category updated successfully."
      );
    });

    it("should return 400 if validation fails", async () => {
      (validations.categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      const res = await request(app)
        .put("/api/category/1")
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/category/:id", () => {
    it("should delete category successfully", async () => {
      (validations.categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (categoryService.deleteCategoryService as jest.Mock).mockResolvedValue(
        undefined
      );

      const res = await request(app).delete("/api/category/1").expect(200);

      expect(res.body).toHaveProperty("message", "Category Deleted.");
    });

    it("should return 400 if validation fails", async () => {
      (validations.categoryIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      const res = await request(app).delete("/api/category/bad").expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });
});
