import { Request, Response } from "express";

import * as categoryController from "../../src/controllers/category.controller";
import * as categoryService from "../../src/services/category.service";
import * as validations from "../../src/validations/category.validation";
import * as formatUtils from "../../src/utils/format";

jest.mock("../../src/services/category.service");
jest.mock("../../src/validations/category.validation");
jest.mock("../../src/utils/format");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

type CategoryMock = {
  _id: string;
  name: string;
  slug?: string;
  image?: { url: string; public_id: string };
  parentId?: string;
};

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (data: Partial<Request>): Request => data as Request;

describe("Category Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCategories", () => {
    it("should return all categories", async () => {
      const categories: CategoryMock[] = [{ _id: "1", name: "Shoes" }];

      jest
        .spyOn(categoryService, "getCategoriesService")
        .mockResolvedValue(categories as never);

      const res = mockResponse();

      await categoryController.getCategories(mockRequest({}), res);

      expect(res.json).toHaveBeenCalledWith(categories);
    });

    it("should handle error", async () => {
      jest
        .spyOn(categoryService, "getCategoriesService")
        .mockRejectedValue(new Error("Error"));

      const res = mockResponse();

      await categoryController.getCategories(mockRequest({}), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createCategory", () => {
    it("should return 400 if validation fails", async () => {
      jest
        .spyOn(validations.createCategorySchema, "safeParse")
        .mockReturnValue({ success: false } as never);

      jest
        .spyOn(formatUtils, "formatValidationError")
        .mockReturnValue("validation error");

      const res = mockResponse();

      await categoryController.createCategory(mockRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create category successfully", async () => {
      jest
        .spyOn(validations.createCategorySchema, "safeParse")
        .mockReturnValue({
          success: true,
          data: {
            name: "Shoes",
            image: { url: "img", public_id: "1" },
            parentId: undefined,
          },
        });

      jest.spyOn(categoryService, "createCategoryService").mockResolvedValue({
        _id: "1",
        name: "shoes",
        slug: "shoes",
        image: { url: "img", public_id: "1" },
      } as never);

      const res = mockResponse();

      await categoryController.createCategory(mockRequest({ body: {} }), res);

      expect(categoryService.createCategoryService).toHaveBeenCalledWith({
        name: "Shoes",
        image: { url: "img", public_id: "1" },
        parentId: undefined,
      });

      expect(res.json).toHaveBeenCalledWith({
        message: "Category created successfully.",
      });
    });

    it("should handle service error", async () => {
      jest
        .spyOn(validations.createCategorySchema, "safeParse")
        .mockReturnValue({
          success: true,
          data: {
            name: "Shoes",
            image: { url: "img", public_id: "1" },
          },
        });

      jest
        .spyOn(categoryService, "createCategoryService")
        .mockRejectedValue(new Error("fail"));

      const res = mockResponse();

      await categoryController.createCategory(mockRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getCategory", () => {
    it("should return 400 if validation fails", async () => {
      jest
        .spyOn(validations.categoryIdSchema, "safeParse")
        .mockReturnValue({ success: false } as never);

      const res = mockResponse();

      await categoryController.getCategory(
        mockRequest({ params: { id: "bad" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return category successfully", async () => {
      const category: CategoryMock = { _id: "1", name: "Shoes" };

      jest.spyOn(validations.categoryIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest
        .spyOn(categoryService, "getCategoryService")
        .mockResolvedValue(category as never);

      const res = mockResponse();

      await categoryController.getCategory(
        mockRequest({ params: { id: "1" } }),
        res
      );

      expect(res.json).toHaveBeenCalledWith(category);
    });

    it("should handle service error", async () => {
      jest.spyOn(validations.categoryIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest
        .spyOn(categoryService, "getCategoryService")
        .mockRejectedValue(new Error("fail"));

      const res = mockResponse();

      await categoryController.getCategory(
        mockRequest({ params: { id: "1" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateCategory", () => {
    it("should return 400 if param validation fails", async () => {
      jest
        .spyOn(validations.categoryIdSchema, "safeParse")
        .mockReturnValue({ success: false } as never);

      const res = mockResponse();

      await categoryController.updateCategory(
        mockRequest({ params: { id: "bad" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if body validation fails", async () => {
      jest.spyOn(validations.categoryIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest
        .spyOn(validations.updateCategorySchema, "safeParse")
        .mockReturnValue({ success: false } as never);

      const res = mockResponse();

      await categoryController.updateCategory(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update category successfully", async () => {
      jest.spyOn(validations.categoryIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest
        .spyOn(validations.updateCategorySchema, "safeParse")
        .mockReturnValue({
          success: true,
          data: {
            name: "Updated",
            image: { url: "img", public_id: "1" },
          },
        });

      jest.spyOn(categoryService, "updateCategoryService").mockResolvedValue({
        _id: "1",
        name: "updated",
      } as never);

      const res = mockResponse();

      await categoryController.updateCategory(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Category updated successfully.",
      });
    });

    it("should handle service error", async () => {
      jest.spyOn(validations.categoryIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest
        .spyOn(validations.updateCategorySchema, "safeParse")
        .mockReturnValue({
          success: true,
          data: {
            name: "Updated",
            image: { url: "img", public_id: "1" },
          },
        });

      jest
        .spyOn(categoryService, "updateCategoryService")
        .mockRejectedValue(new Error("fail"));

      const res = mockResponse();

      await categoryController.updateCategory(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteCategory", () => {
    it("should return 400 if validation fails", async () => {
      jest
        .spyOn(validations.categoryIdSchema, "safeParse")
        .mockReturnValue({ success: false } as never);

      const res = mockResponse();

      await categoryController.deleteCategory(
        mockRequest({ params: { id: "bad" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete category successfully", async () => {
      jest.spyOn(validations.categoryIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest.spyOn(categoryService, "deleteCategoryService").mockResolvedValue({
        _id: "1",
        name: "deleted",
      } as never);

      const res = mockResponse();

      await categoryController.deleteCategory(
        mockRequest({ params: { id: "1" } }),
        res
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Category Deleted.",
      });
    });

    it("should handle service error", async () => {
      jest.spyOn(validations.categoryIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest
        .spyOn(categoryService, "deleteCategoryService")
        .mockRejectedValue(new Error("fail"));

      const res = mockResponse();

      await categoryController.deleteCategory(
        mockRequest({ params: { id: "1" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
