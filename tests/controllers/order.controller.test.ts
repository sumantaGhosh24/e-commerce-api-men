import { Request, Response } from "express";

import * as orderController from "../../src/controllers/order.controller";
import * as orderService from "../../src/services/order.service";
import * as validations from "../../src/validations/order.validation";
import * as formatUtils from "../../src/utils/format";
import { IReqAuth } from "../../src/types";
import { IUser } from "../../src/models/user.model";

jest.mock("../../src/services/order.service");
jest.mock("../../src/validations/order.validation");
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

const createMockUser = (overrides: Partial<IUser> = {}): IUser =>
  ({
    _id: "user1",
    email: "test@mail.com",
    password: "hashed",
    mobileNumber: "9999999999",
    firstName: "Test",
    lastName: "User",
    ...overrides,
  }) as IUser;

const mockAuthRequest = (overrides: Partial<IReqAuth> = {}): IReqAuth =>
  ({
    body: {},
    params: {},
    query: {},
    user: createMockUser(),
    ...overrides,
  }) as IReqAuth;

describe("Order Controller", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getRazorpay", () => {
    it("should return razorpay order", async () => {
      (orderService.getRazorpayService as jest.Mock).mockResolvedValue({
        id: "rzp_123",
      });

      const res = mockResponse();

      await orderController.getRazorpay(
        mockRequest({ body: { amount: 100 } }),
        res
      );

      expect(res.json).toHaveBeenCalledWith({ id: "rzp_123" });
    });

    it("should return 500 on error", async () => {
      (orderService.getRazorpayService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();

      await orderController.getRazorpay(
        mockRequest({ body: { amount: 100 } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("verification", () => {
    it("should return 400 if validation fails", async () => {
      (
        validations.orderVerificationSchema.safeParse as jest.Mock
      ).mockReturnValue({
        success: false,
        error: {},
      });

      (formatUtils.formatValidationError as jest.Mock).mockReturnValue("error");

      const res = mockResponse();

      await orderController.verification(mockAuthRequest(), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should verify order successfully", async () => {
      const mockData = {
        orderCreationId: "1",
        razorpayPaymentId: "p1",
        razorpayOrderId: "r1",
        razorpaySignature: "sig",
        orderItems: [],
        shippingAddress: {},
        price: 100,
        taxPrice: 10,
        shippingPrice: 5,
        totalPrice: 115,
        cartId: "c1",
      };

      (
        validations.orderVerificationSchema.safeParse as jest.Mock
      ).mockReturnValue({
        success: true,
        data: mockData,
      });

      (orderService.verifyAndCreateOrderService as jest.Mock).mockResolvedValue(
        {
          orderId: "order123",
          paymentId: "payment123",
        }
      );

      const res = mockResponse();

      await orderController.verification(
        mockAuthRequest({ user: createMockUser({ _id: "user1" }) }),
        res
      );

      expect(orderService.verifyAndCreateOrderService).toHaveBeenCalledWith({
        ...mockData,
        userId: "user1",
      });

      expect(res.json).toHaveBeenCalledWith({
        message: "success",
        orderId: "order123",
        paymentId: "payment123",
      });
    });

    it("should return 500 on service error", async () => {
      (
        validations.orderVerificationSchema.safeParse as jest.Mock
      ).mockReturnValue({
        success: true,
        data: {},
      });

      (orderService.verifyAndCreateOrderService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();

      await orderController.verification(mockAuthRequest(), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getOrders", () => {
    it("should return orders", async () => {
      (orderService.getOrdersService as jest.Mock).mockResolvedValue({
        orders: [],
        count: 0,
      });

      const res = mockResponse();

      await orderController.getOrders(mockRequest({ query: {} }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        orders: [],
        count: 0,
      });
    });

    it("should return 500 on error", async () => {
      (orderService.getOrdersService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();

      await orderController.getOrders(mockRequest({ query: {} }), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getOrder", () => {
    it("should return 400 if validation fails", async () => {
      (validations.orderIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      const res = mockResponse();

      await orderController.getOrder(mockRequest({ params: { id: "" } }), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return order", async () => {
      (validations.orderIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (orderService.getOrderService as jest.Mock).mockResolvedValue({
        id: "1",
      });

      const res = mockResponse();

      await orderController.getOrder(mockRequest({ params: { id: "1" } }), res);

      expect(res.json).toHaveBeenCalledWith({ id: "1" });
    });

    it("should return 500 on error", async () => {
      (validations.orderIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (orderService.getOrderService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();

      await orderController.getOrder(mockRequest({ params: { id: "1" } }), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateOrder", () => {
    it("should return 400 if param validation fails", async () => {
      (validations.orderIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      const res = mockResponse();

      await orderController.updateOrder(
        mockRequest({ params: { id: "" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if body validation fails", async () => {
      (validations.orderIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (validations.updateOrderSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      const res = mockResponse();

      await orderController.updateOrder(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update order", async () => {
      (validations.orderIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      (validations.updateOrderSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { status: "shipped" },
      });

      const res = mockResponse();

      await orderController.updateOrder(
        mockRequest({ params: { id: "1" }, body: {} }),
        res
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Order updated successfully.",
      });
    });
  });

  describe("getUserOrders", () => {
    it("should return user orders", async () => {
      (orderService.getUserOrdersService as jest.Mock).mockResolvedValue({
        orders: [],
        count: 0,
      });

      const res = mockResponse();

      await orderController.getUserOrders(mockAuthRequest(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        orders: [],
        count: 0,
      });
    });

    it("should return 500 on error", async () => {
      (orderService.getUserOrdersService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();

      await orderController.getUserOrders(mockAuthRequest(), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
