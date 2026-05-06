import slugify from "slugify";

import Brand from "../../src/models/brand.model";
import Product from "../../src/models/product.model";
import redisClient from "../../src/config/redis";
import { CACHE_KEYS } from "../../src/config/cacheKeys";
import {
  getBrandsService,
  createBrandService,
  getBrandService,
  updateBrandService,
  deleteBrandService,
} from "../../src/services/brand.service";

jest.mock("slugify", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../src/models/brand.model");
jest.mock("../../src/models/product.model");
jest.mock("../../src/config/redis");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockedSlugify = slugify as unknown as jest.MockedFunction<typeof slugify>;
const mockedBrand = Brand as jest.Mocked<typeof Brand>;
const mockedProduct = Product as jest.Mocked<typeof Product>;
const mockedRedis = redisClient as jest.Mocked<typeof redisClient>;

describe("Brand Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getBrandsService", () => {
    it("should return cached brands", async () => {
      const fakeBrands = [{ name: "nike" }];

      mockedRedis.get.mockResolvedValue(JSON.stringify(fakeBrands));

      const result = await getBrandsService();

      expect(mockedRedis.get).toHaveBeenCalledWith(CACHE_KEYS.BRANDS);
      expect(result).toEqual(fakeBrands);
    });

    it("should fetch from DB and cache when no cache", async () => {
      const fakeBrands = [{ name: "adidas" }];

      mockedRedis.get.mockResolvedValue(null);
      mockedBrand.find.mockResolvedValue(fakeBrands);

      const result = await getBrandsService();

      expect(mockedBrand.find).toHaveBeenCalled();
      expect(mockedRedis.setEx).toHaveBeenCalledWith(
        CACHE_KEYS.BRANDS,
        expect.any(Number),
        JSON.stringify(fakeBrands)
      );
      expect(result).toEqual(fakeBrands);
    });

    it("should throw if redis fails", async () => {
      mockedRedis.get.mockRejectedValue(new Error("redis fail"));

      await expect(getBrandsService()).rejects.toThrow("redis fail");
    });
  });

  describe("createBrandService", () => {
    it("should throw if brand exists", async () => {
      mockedBrand.findOne.mockResolvedValue({ name: "nike" });

      await expect(
        createBrandService("nike", { url: "img", public_id: "1" })
      ).rejects.toThrow("This brand already exists.");
    });

    it("should create brand successfully", async () => {
      mockedBrand.findOne.mockResolvedValue(null);
      mockedSlugify.mockReturnValue("nike");

      const saveMock = jest.fn();

      (mockedBrand as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await createBrandService("Nike", {
        url: "img",
        public_id: "1",
      });

      expect(mockedSlugify).toHaveBeenCalledWith("Nike", {
        lower: true,
        trim: true,
      });

      expect(saveMock).toHaveBeenCalled();
      expect(mockedRedis.del).toHaveBeenCalledWith(CACHE_KEYS.BRANDS);
      expect(result).toBeDefined();
    });
  });

  describe("getBrandService", () => {
    it("should return cached brand", async () => {
      const fakeBrand = { name: "nike" };

      mockedRedis.get.mockResolvedValue(JSON.stringify(fakeBrand));

      const result = await getBrandService("1");

      expect(result).toEqual(fakeBrand);
    });

    it("should fetch from DB if no cache", async () => {
      const fakeBrand = { name: "nike" };

      mockedRedis.get.mockResolvedValue(null);
      mockedBrand.findById.mockResolvedValue(fakeBrand);

      const result = await getBrandService("1");

      expect(mockedBrand.findById).toHaveBeenCalledWith("1");
      expect(mockedRedis.setEx).toHaveBeenCalledWith(
        CACHE_KEYS.BRAND("1"),
        expect.any(Number),
        JSON.stringify(fakeBrand)
      );
      expect(result).toEqual(fakeBrand);
    });

    it("should throw if brand not found", async () => {
      mockedRedis.get.mockResolvedValue(null);
      mockedBrand.findById.mockResolvedValue(null);

      await expect(getBrandService("1")).rejects.toThrow("Brand not found.");
    });
  });

  describe("updateBrandService", () => {
    it("should update brand successfully", async () => {
      mockedSlugify.mockReturnValue("nike");

      const updatedBrand = { name: "nike" };

      mockedBrand.findByIdAndUpdate.mockResolvedValue(updatedBrand);

      const result = await updateBrandService("1", "Nike", {
        url: "img",
        public_id: "1",
      });

      expect(mockedBrand.findByIdAndUpdate).toHaveBeenCalledWith(
        "1",
        {
          name: "Nike",
          image: { url: "img", public_id: "1" },
          slug: "nike",
        },
        { new: true }
      );

      expect(mockedRedis.del).toHaveBeenCalledWith(CACHE_KEYS.BRANDS);
      expect(mockedRedis.del).toHaveBeenCalledWith(CACHE_KEYS.BRAND("1"));

      expect(result).toEqual(updatedBrand);
    });

    it("should throw if brand not found", async () => {
      mockedSlugify.mockReturnValue("nike");

      mockedBrand.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        updateBrandService("1", "Nike", {
          url: "img",
          public_id: "1",
        })
      ).rejects.toThrow("This Brand Does Not Exists.");
    });
  });

  describe("deleteBrandService", () => {
    it("should throw if product exists for brand", async () => {
      mockedProduct.findOne.mockResolvedValue({ _id: "p1" });

      await expect(deleteBrandService("1")).rejects.toThrow(
        "Please delete all product of this brand first."
      );
    });

    it("should delete brand successfully", async () => {
      mockedProduct.findOne.mockResolvedValue(null);
      mockedBrand.findByIdAndDelete.mockResolvedValue({});

      const result = await deleteBrandService("1");

      expect(mockedBrand.findByIdAndDelete).toHaveBeenCalledWith("1");
      expect(mockedRedis.del).toHaveBeenCalledWith(CACHE_KEYS.BRANDS);
      expect(mockedRedis.del).toHaveBeenCalledWith(CACHE_KEYS.BRAND("1"));
      expect(result).toBeDefined();
    });
  });
});
