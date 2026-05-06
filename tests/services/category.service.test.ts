import slugify from "slugify";

import Category from "../../src/models/category.model";
import Product from "../../src/models/product.model";
import redisClient from "../../src/config/redis";
import { CACHE_KEYS } from "../../src/config/cacheKeys";
import * as categoryService from "../../src/services/category.service";

jest.mock("slugify");
jest.mock("../../src/models/category.model");
jest.mock("../../src/models/product.model");
jest.mock("../../src/config/redis");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockedSlugify = slugify as jest.MockedFunction<typeof slugify>;
const mockedCategory = Category as jest.Mocked<typeof Category>;
const mockedProduct = Product as jest.Mocked<typeof Product>;
const mockedRedis = redisClient as jest.Mocked<typeof redisClient>;

describe("Category Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCategoriesService", () => {
    it("should return cached categories", async () => {
      const fake = [{ name: "parent" }];

      mockedRedis.get.mockResolvedValue(JSON.stringify(fake));

      const result = await categoryService.getCategoriesService();

      expect(result).toEqual(fake);
    });

    it("should build tree and cache when no cache", async () => {
      const categories = [
        { _id: "1", name: "parent", parentId: undefined, image: {} },
        { _id: "2", name: "child", parentId: "1", image: {} },
      ];

      mockedRedis.get.mockResolvedValue(null);
      mockedCategory.find.mockResolvedValue(categories as never); // ✅ FIX

      const result = await categoryService.getCategoriesService();

      expect(result).toHaveLength(1);
      expect(mockedRedis.setEx).toHaveBeenCalled();
    });
  });

  describe("createCategoryService", () => {
    it("should throw if category exists", async () => {
      mockedCategory.findOne.mockResolvedValue({} as never);

      await expect(
        categoryService.createCategoryService({
          name: "test",
          image: { url: "", public_id: "" },
        })
      ).rejects.toThrow("This category already exists.");
    });

    it("should create category successfully", async () => {
      mockedCategory.findOne.mockResolvedValue(null);
      mockedSlugify.mockReturnValue("test");

      const saveMock = jest.fn();

      (mockedCategory as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await categoryService.createCategoryService({
        name: "Test",
        image: { url: "", public_id: "" },
      });

      expect(mockedSlugify).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
      expect(mockedRedis.del).toHaveBeenCalledWith(CACHE_KEYS.CATEGORIES);

      expect(result).toBeNull();
    });
  });

  describe("getCategoryService", () => {
    it("should return cached category", async () => {
      const fake = { name: "cat" };

      mockedRedis.get.mockResolvedValue(JSON.stringify(fake));

      const result = await categoryService.getCategoryService("1");

      expect(result).toEqual(fake);
    });

    it("should fetch and cache category", async () => {
      const fake = { name: "cat" };

      mockedRedis.get.mockResolvedValue(null);
      mockedCategory.findById.mockResolvedValue(fake as never); // ✅ FIX

      const result = await categoryService.getCategoryService("1");

      expect(result).toEqual(fake);
      expect(mockedRedis.setEx).toHaveBeenCalled();
    });

    it("should throw if category not found", async () => {
      mockedRedis.get.mockResolvedValue(null);
      mockedCategory.findById.mockResolvedValue(null);

      await expect(categoryService.getCategoryService("1")).rejects.toThrow(
        "This category does not exists."
      );
    });
  });

  describe("updateCategoryService", () => {
    it("should update category successfully", async () => {
      mockedSlugify.mockReturnValue("updated");

      const updated = { name: "updated" };

      mockedCategory.findByIdAndUpdate.mockResolvedValue(updated as never);

      const result = await categoryService.updateCategoryService("1", {
        name: "Updated",
        image: { url: "", public_id: "" },
      });

      expect(result).toEqual(updated);
      expect(mockedRedis.del).toHaveBeenCalled();
    });

    it("should include parentId when provided", async () => {
      mockedSlugify.mockReturnValue("updated");

      mockedCategory.findByIdAndUpdate.mockResolvedValue({} as never);

      await categoryService.updateCategoryService("1", {
        name: "Updated",
        image: { url: "", public_id: "" },
        parentId: "p1",
      });

      expect(mockedCategory.findByIdAndUpdate).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({ parentId: "p1" }),
        { new: true }
      );
    });

    it("should throw if category not found", async () => {
      mockedSlugify.mockReturnValue("updated");

      mockedCategory.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        categoryService.updateCategoryService("1", {
          name: "Updated",
          image: { url: "", public_id: "" },
        })
      ).rejects.toThrow("This Category Does Not Exists.");
    });
  });

  describe("deleteCategoryService", () => {
    it("should throw if product exists", async () => {
      mockedProduct.findOne.mockResolvedValue({} as never);

      await expect(categoryService.deleteCategoryService("1")).rejects.toThrow(
        "Please delete all product of this category first."
      );
    });

    it("should throw if subcategories exist", async () => {
      mockedProduct.findOne.mockResolvedValue(null);
      mockedCategory.find.mockResolvedValue([{}] as never);

      await expect(categoryService.deleteCategoryService("1")).rejects.toThrow(
        "Please delete all sub category of this category."
      );
    });

    it("should delete category successfully", async () => {
      mockedProduct.findOne.mockResolvedValue(null);
      mockedCategory.find.mockResolvedValue([] as never);
      mockedCategory.findByIdAndDelete.mockResolvedValue({} as never);

      const result = await categoryService.deleteCategoryService("1");

      expect(result).toEqual([]);
      expect(mockedRedis.del).toHaveBeenCalled();
    });

    it("should NOT throw if category not found (current behavior)", async () => {
      mockedProduct.findOne.mockResolvedValue(null);
      mockedCategory.find.mockResolvedValue([] as never);
      mockedCategory.findByIdAndDelete.mockResolvedValue(null);

      const result = await categoryService.deleteCategoryService("1");

      expect(result).toEqual([]);
    });
  });
});
