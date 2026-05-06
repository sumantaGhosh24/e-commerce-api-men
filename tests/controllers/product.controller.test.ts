import { Request, Response } from "express";

import { IReqAuth } from "../../src/types";
import * as productController from "../../src/controllers/product.controller";
import * as productService from "../../src/services/product.service";
import * as validations from "../../src/validations/product.validation";
import * as formatUtils from "../../src/utils/format";

jest.mock("../../src/services/product.service");
jest.mock("../../src/utils/format");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (data: Partial<Request>): Request => data as Request;

const mockAuthRequest = (data: Partial<IReqAuth>): IReqAuth => data as IReqAuth;

describe("Product Controller (FINAL)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProducts", () => {
    it("should return products", async () => {
      (productService.getProductsService as jest.Mock).mockResolvedValue({
        products: [],
        count: 0,
      });

      const req = mockAuthRequest({ query: {} });
      const res = mockResponse();

      await productController.getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        products: [],
        count: 0,
      });
    });

    it("should handle service error", async () => {
      (productService.getProductsService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const req = mockAuthRequest({ query: {} });
      const res = mockResponse();

      await productController.getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getProduct", () => {
    it("should return 400 if validation fails", async () => {
      jest.spyOn(validations.productIdSchema, "safeParse").mockReturnValue({
        success: false,
        error: {} as never,
      });

      const req = mockAuthRequest({ params: { id: "" } });
      const res = mockResponse();

      await productController.getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return product", async () => {
      jest.spyOn(validations.productIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (productService.getProductService as jest.Mock).mockResolvedValue({
        _id: "1",
      });

      const req = mockAuthRequest({ params: { id: "1" } });
      const res = mockResponse();

      await productController.getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ _id: "1" });
    });

    it("should handle service error", async () => {
      jest.spyOn(validations.productIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (productService.getProductService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const req = mockAuthRequest({ params: { id: "1" } });
      const res = mockResponse();

      await productController.getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createProduct", () => {
    it("should return 400 if validation fails", async () => {
      jest.spyOn(validations.createProductSchema, "safeParse").mockReturnValue({
        success: false,
        error: {} as never,
      });

      (formatUtils.formatValidationError as jest.Mock).mockReturnValue(
        "validation error"
      );

      const req = mockAuthRequest({
        body: {},
        user: { _id: "u1" } as IReqAuth["user"],
      });

      const res = mockResponse();

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create product successfully", async () => {
      jest.spyOn(validations.createProductSchema, "safeParse").mockReturnValue({
        success: true,
        data: {
          title: "TEST",
          description: "DESC",
          content: "c",
          category: "cat",
          brand: "brand",
          price: 10,
          checked: true,
          stock: 1,
          sold: 0,
          images: [{ url: "img", public_id: "1" }],
        },
      });

      (productService.createProductService as jest.Mock).mockResolvedValue({
        title: "test",
      });

      const req = mockAuthRequest({
        user: { _id: "u1" } as IReqAuth["user"],
      });

      const res = mockResponse();

      await productController.createProduct(req, res);

      expect(productService.createProductService).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "test",
          description: "desc",
        }),
        "u1"
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Product created successfully.",
      });
    });

    it("should handle service error", async () => {
      jest.spyOn(validations.createProductSchema, "safeParse").mockReturnValue({
        success: true,
        data: {
          title: "a",
          description: "b",
          content: "c",
          category: "cat",
          brand: "brand",
          price: 1,
          checked: true,
          stock: 1,
          sold: 0,
          images: [{ url: "img", public_id: "1" }],
        },
      });

      (productService.createProductService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const req = mockAuthRequest({
        user: { _id: "u1" } as IReqAuth["user"],
      });

      const res = mockResponse();

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateProduct", () => {
    it("should fail param validation", async () => {
      jest.spyOn(validations.productIdSchema, "safeParse").mockReturnValue({
        success: false,
        error: {} as never,
      });

      const res = mockResponse();

      await productController.updateProduct(
        mockRequest({ params: { id: "" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update successfully", async () => {
      jest.spyOn(validations.productIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest.spyOn(validations.updateProductSchema, "safeParse").mockReturnValue({
        success: true,
        data: { title: "updated" },
      });

      (productService.updateProductService as jest.Mock).mockResolvedValue(
        undefined
      );

      const res = mockResponse();

      await productController.updateProduct(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(productService.updateProductService).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Product updated successfully.",
      });
    });
  });

  describe("addImages", () => {
    it("should add images", async () => {
      jest.spyOn(validations.productIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest
        .spyOn(validations.addProductImageSchema, "safeParse")
        .mockReturnValue({
          success: true,
          data: { images: [{ url: "img", public_id: "1" }] },
        });

      const res = mockResponse();

      await productController.addImages(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(productService.addImagesService).toHaveBeenCalledWith("1", [
        { url: "img", public_id: "1" },
      ]);
    });
  });

  describe("removeImages", () => {
    it("should remove image", async () => {
      jest.spyOn(validations.productIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      jest
        .spyOn(validations.removeProductImageSchema, "safeParse")
        .mockReturnValue({
          success: true,
          data: { public_id: "1" },
        });

      const res = mockResponse();

      await productController.removeImages(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(productService.removeImagesService).toHaveBeenCalledWith("1", "1");
    });
  });

  describe("deleteProduct", () => {
    it("should delete product", async () => {
      jest.spyOn(validations.productIdSchema, "safeParse").mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (productService.deleteProductService as jest.Mock).mockResolvedValue(
        undefined
      );

      const res = mockResponse();

      await productController.deleteProduct(
        mockRequest({ params: { id: "1" } }),
        res
      );

      expect(productService.deleteProductService).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith({
        message: "Product deleted successfully.",
      });
    });
  });
});
