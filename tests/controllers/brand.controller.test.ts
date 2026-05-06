import { Request, Response } from "express";

import * as brandController from "../../src/controllers/brand.controller";
import * as brandService from "../../src/services/brand.service";
import * as validations from "../../src/validations/brand.validation";
import * as formatUtils from "../../src/utils/format";

jest.mock("../../src/services/brand.service");
jest.mock("../../src/validations/brand.validation");
jest.mock("../../src/utils/format");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockRequest = (data: Partial<Request>): Request =>
  data as unknown as Request;

describe("Brand Controller", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getBrands", () => {
    it("should return all brands", async () => {
      (brandService.getBrandsService as jest.Mock).mockResolvedValue([
        { name: "Nike" },
      ]);

      const res = mockResponse();
      await brandController.getBrands(mockRequest({}), res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: "Nike" })])
      );
    });

    it("should return 500 on error", async () => {
      (brandService.getBrandsService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();
      await brandController.getBrands(mockRequest({}), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createBrand", () => {
    it("should return 400 if validation fails", async () => {
      (validations.createBrandSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "error",
      });

      (formatUtils.formatValidationError as jest.Mock).mockReturnValue(
        "validation error"
      );

      const res = mockResponse();
      await brandController.createBrand(mockRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation failed",
          message: "validation error",
        })
      );
    });

    it("should create brand successfully", async () => {
      (validations.createBrandSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "Nike",
          image: { url: "img.png", public_id: "1" },
        },
      });

      (brandService.createBrandService as jest.Mock).mockResolvedValue({});

      const res = mockResponse();
      await brandController.createBrand(mockRequest({ body: {} }), res);

      expect(brandService.createBrandService).toHaveBeenCalledWith("Nike", {
        url: "img.png",
        public_id: "1",
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    it("should return 500 on error", async () => {
      (validations.createBrandSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "Nike",
          image: { url: "img.png", public_id: "1" },
        },
      });

      (brandService.createBrandService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();
      await brandController.createBrand(mockRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getBrand", () => {
    it("should return 400 if validation fails", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "error",
      });

      const res = mockResponse();
      await brandController.getBrand(mockRequest({ params: { id: "" } }), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return brand successfully", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (brandService.getBrandService as jest.Mock).mockResolvedValue({
        name: "Nike",
      });

      const res = mockResponse();
      await brandController.getBrand(mockRequest({ params: { id: "1" } }), res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nike" })
      );
    });

    it("should return 500 on error", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (brandService.getBrandService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();
      await brandController.getBrand(mockRequest({ params: { id: "1" } }), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateBrand", () => {
    it("should return 400 if param validation fails", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "error",
      });

      const res = mockResponse();
      await brandController.updateBrand(
        mockRequest({ params: { id: "" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if body validation fails", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (validations.updateBrandSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "error",
      });

      const res = mockResponse();
      await brandController.updateBrand(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update brand successfully", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (validations.updateBrandSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "Adidas",
          image: { url: "img.png", public_id: "1" },
        },
      });

      (brandService.updateBrandService as jest.Mock).mockResolvedValue({});

      const res = mockResponse();
      await brandController.updateBrand(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    it("should return 500 on error", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (validations.updateBrandSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          name: "Adidas",
          image: { url: "img.png", public_id: "1" },
        },
      });

      (brandService.updateBrandService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();
      await brandController.updateBrand(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteBrand", () => {
    it("should return 400 if validation fails", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "error",
      });

      const res = mockResponse();
      await brandController.deleteBrand(
        mockRequest({ params: { id: "" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete brand successfully", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (brandService.deleteBrandService as jest.Mock).mockResolvedValue({});

      const res = mockResponse();
      await brandController.deleteBrand(
        mockRequest({ params: { id: "1" } }),
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    it("should return 500 on error", async () => {
      (validations.brandIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (brandService.deleteBrandService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();
      await brandController.deleteBrand(
        mockRequest({ params: { id: "1" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
