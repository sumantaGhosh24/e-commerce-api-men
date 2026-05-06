import Product from "../../src/models/product.model";
import redisClient from "../../src/config/redis";
import { APIFeatures } from "../../src/utils/pagination";
import * as productService from "../../src/services/product.service";

jest.mock("../../src/config/redis");
jest.mock("../../src/utils/pagination");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockedRedis = redisClient as jest.Mocked<typeof redisClient>;
const MockedAPIFeatures = APIFeatures as unknown as jest.Mock;

const mockFeatures = <T>(data: T) => ({
  query: Promise.resolve(data),
  paginating: jest.fn().mockReturnThis(),
  sorting: jest.fn().mockReturnThis(),
  searching: jest.fn().mockReturnThis(),
  filtering: jest.fn().mockReturnThis(),
});

describe("Product Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProductsService", () => {
    it("returns cached data", async () => {
      mockedRedis.get.mockResolvedValue(
        JSON.stringify({ products: [], count: 0 })
      );

      const result = await productService.getProductsService({});

      expect(result).toEqual({ products: [], count: 0 });
    });

    it("fetches from DB and caches", async () => {
      mockedRedis.get.mockResolvedValue(null);

      MockedAPIFeatures.mockImplementation(() => mockFeatures([{ _id: "1" }]));

      mockedRedis.setEx.mockResolvedValue("OK");

      const result = await productService.getProductsService({});

      expect(result.products).toEqual([{ _id: "1" }]);
      expect(result.count).toBe(1);
      expect(mockedRedis.setEx).toHaveBeenCalled();
    });
  });

  describe("getProductService", () => {
    it("returns cached product", async () => {
      mockedRedis.get.mockResolvedValue(JSON.stringify({ _id: "1" }));

      const result = await productService.getProductService("1");

      expect(result).toEqual({ _id: "1" });
    });

    it("fetches from DB and caches", async () => {
      mockedRedis.get.mockResolvedValue(null);

      jest.spyOn(Product, "findById").mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve: (_val: unknown) => void) => resolve({ _id: "1" }),
      } as unknown as ReturnType<typeof Product.findById>);

      mockedRedis.setEx.mockResolvedValue("OK");

      const result = await productService.getProductService("1");

      expect(result).toEqual({ _id: "1" });
      expect(mockedRedis.setEx).toHaveBeenCalled();
    });

    it("returns null if not found", async () => {
      mockedRedis.get.mockResolvedValue(null);

      jest.spyOn(Product, "findById").mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve: (_val: unknown) => void) => resolve(null),
      } as unknown as ReturnType<typeof Product.findById>);

      const result = await productService.getProductService("1");

      expect(result).toBeNull();
    });
  });

  describe("createProductService", () => {
    it("creates product and clears cache", async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);

      jest.spyOn(Product.prototype, "save").mockImplementation(saveMock);

      mockedRedis.keys.mockResolvedValue(["products:1"]);
      mockedRedis.del.mockResolvedValue(1);

      const result = await productService.createProductService(
        {
          title: "TEST",
          description: "DESC",
          content: "content",
          category: "cat",
          brand: "brand",
          price: 100,
          checked: false,
          stock: 10,
          sold: 0,
          images: [],
        },
        "user1"
      );

      expect(saveMock).toHaveBeenCalled();
      expect(mockedRedis.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("updateProductService", () => {
    it("updates product and clears cache", async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);

      jest.spyOn(Product, "findById").mockResolvedValue({
        title: "",
        description: "",
        content: "",
        save: saveMock,
      } as unknown as Awaited<ReturnType<typeof Product.findById>>);

      mockedRedis.del.mockResolvedValue(1);
      mockedRedis.keys.mockResolvedValue([]);

      await productService.updateProductService("1", { title: "Updated" });

      expect(saveMock).toHaveBeenCalled();
      expect(mockedRedis.del).toHaveBeenCalled();
    });

    it("throws if product not found", async () => {
      jest.spyOn(Product, "findById").mockResolvedValue(null);

      await expect(
        productService.updateProductService("1", { title: "test" })
      ).rejects.toThrow("Product does not exists.");
    });
  });

  describe("addImagesService", () => {
    it("adds images", async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);

      jest.spyOn(Product, "findById").mockResolvedValue({
        images: [],
        save: saveMock,
      } as unknown as Awaited<ReturnType<typeof Product.findById>>);

      mockedRedis.del.mockResolvedValue(1);
      mockedRedis.keys.mockResolvedValue([]);

      await productService.addImagesService("1", [
        { url: "img", public_id: "1" },
      ]);

      expect(saveMock).toHaveBeenCalled();
    });

    it("throws if product not found", async () => {
      jest.spyOn(Product, "findById").mockResolvedValue(null);

      await expect(productService.addImagesService("1", [])).rejects.toThrow(
        "Product does not exists."
      );
    });
  });

  describe("removeImagesService", () => {
    it("removes image", async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);

      jest.spyOn(Product, "findById").mockResolvedValue({
        images: [{ public_id: "1" }],
        save: saveMock,
      } as unknown as Awaited<ReturnType<typeof Product.findById>>);

      mockedRedis.del.mockResolvedValue(1);
      mockedRedis.keys.mockResolvedValue([]);

      await productService.removeImagesService("1", "1");

      expect(saveMock).toHaveBeenCalled();
    });

    it("throws if product not found", async () => {
      jest.spyOn(Product, "findById").mockResolvedValue(null);

      await expect(
        productService.removeImagesService("1", "1")
      ).rejects.toThrow("Product does not exists.");
    });
  });

  describe("deleteProductService", () => {
    it("deletes product", async () => {
      jest.spyOn(Product, "findById").mockResolvedValue({ _id: "1" } as never);
      jest.spyOn(Product, "findByIdAndDelete").mockResolvedValue(null);

      mockedRedis.del.mockResolvedValue(1);
      mockedRedis.keys.mockResolvedValue([]);

      await productService.deleteProductService("1");

      expect(Product.findByIdAndDelete).toHaveBeenCalledWith("1");
      expect(mockedRedis.del).toHaveBeenCalled();
    });

    it("throws if not found", async () => {
      jest.spyOn(Product, "findById").mockResolvedValue(null);

      await expect(productService.deleteProductService("1")).rejects.toThrow(
        "Product does not exists."
      );
    });
  });
});
