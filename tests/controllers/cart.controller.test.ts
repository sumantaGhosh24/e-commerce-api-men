import { Response, Request } from "express";

import * as cartController from "../../src/controllers/cart.controller";
import * as cartService from "../../src/services/cart.service";
import * as validations from "../../src/validations/cart.validation";
import * as formatUtils from "../../src/utils/format";

jest.mock("../../src/services/cart.service");
jest.mock("../../src/validations/cart.validation");
jest.mock("../../src/utils/format");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

type MockRequest = Partial<Request> & {
  user?: { _id: string };
};

const mockResponse = (): Response => {
  const res = {} as Response;

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
};

const mockRequest = (data: MockRequest): Request => data as unknown as Request;

describe("Cart Controller", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getCart", () => {
    it("should return cart", async () => {
      const cart = { products: [] };

      (cartService.getCartService as jest.Mock).mockResolvedValue(cart);

      const req = mockRequest({ user: { _id: "user1" } });
      const res = mockResponse();

      await cartController.getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(cart);
    });

    it("should handle error", async () => {
      (cartService.getCartService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const req = mockRequest({ user: { _id: "user1" } });
      const res = mockResponse();

      await cartController.getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("addCart", () => {
    it("should fail validation", async () => {
      (validations.addCartSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "err",
      });

      (formatUtils.formatValidationError as jest.Mock).mockReturnValue("msg");

      const req = mockRequest({ user: { _id: "u1" }, body: {} });
      const res = mockResponse();

      await cartController.addCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should add product", async () => {
      (validations.addCartSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { productId: "p1", quantity: 2 },
      });

      (cartService.addCartService as jest.Mock).mockResolvedValue(undefined);

      const req = mockRequest({ user: { _id: "u1" }, body: {} });
      const res = mockResponse();

      await cartController.addCart(req, res);

      expect(cartService.addCartService).toHaveBeenCalledWith({
        userId: "u1",
        productId: "p1",
        quantity: 2,
      });

      expect(res.json).toHaveBeenCalledWith({
        message: "Product added to cart.",
      });
    });

    it("should handle service error", async () => {
      (validations.addCartSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { productId: "p1", quantity: 2 },
      });

      (cartService.addCartService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const req = mockRequest({ user: { _id: "u1" }, body: {} });
      const res = mockResponse();

      await cartController.addCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("removeCart", () => {
    it("should fail validation", async () => {
      (validations.removeCartSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "err",
      });

      const req = mockRequest({ user: { _id: "u1" }, body: {} });
      const res = mockResponse();

      await cartController.removeCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should remove product", async () => {
      (validations.removeCartSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { productId: "p1" },
      });

      (cartService.removeCartService as jest.Mock).mockResolvedValue(undefined);

      const req = mockRequest({ user: { _id: "u1" }, body: {} });
      const res = mockResponse();

      await cartController.removeCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Product removed from cart.",
      });
    });

    it("should handle error", async () => {
      (validations.removeCartSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { productId: "p1" },
      });

      (cartService.removeCartService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const req = mockRequest({ user: { _id: "u1" }, body: {} });
      const res = mockResponse();

      await cartController.removeCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("clearCart", () => {
    it("should clear cart", async () => {
      (cartService.clearCartService as jest.Mock).mockResolvedValue(true);

      const req = mockRequest({ user: { _id: "u1" } });
      const res = mockResponse();

      await cartController.clearCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Cart cleared.",
      });
    });

    it("should handle error", async () => {
      (cartService.clearCartService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const req = mockRequest({ user: { _id: "u1" } });
      const res = mockResponse();

      await cartController.clearCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
