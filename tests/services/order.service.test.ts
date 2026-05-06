import crypto from "crypto";

import Order from "../../src/models/order.model";
import Cart from "../../src/models/cart.model";
import redisClient from "../../src/config/redis";
import * as orderService from "../../src/services/order.service";

jest.mock("../../src/models/order.model");
jest.mock("../../src/models/cart.model");
jest.mock("../../src/config/redis");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockedOrder = Order as unknown as jest.Mocked<typeof Order>;
const mockedCart = Cart as unknown as jest.Mocked<typeof Cart>;
const mockedRedis = redisClient as unknown as jest.Mocked<typeof redisClient>;

const createMockHmac = (digestValue: string): crypto.Hmac =>
  ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue(digestValue),
  }) as unknown as crypto.Hmac;

describe("Order Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("verifyAndCreateOrderService", () => {
    const basePayload = {
      orderCreationId: "test",
      razorpayPaymentId: "pay_123",
      razorpayOrderId: "order_123",
      razorpaySignature: "valid_signature",
      orderItems: [],
      shippingAddress: {
        address: "test",
        city: "kolkata",
        pin: "700000",
        country: "india",
        state: "wb",
      },
      price: 100,
      taxPrice: 10,
      shippingPrice: 5,
      totalPrice: 115,
      cartId: "cart_1",
      userId: "user_1",
    };

    it("should verify payment and create order", async () => {
      jest
        .spyOn(crypto, "createHmac")
        .mockReturnValue(createMockHmac("valid_signature"));

      mockedOrder.prototype.save = jest.fn().mockResolvedValue(undefined);
      mockedCart.findByIdAndDelete.mockResolvedValue(null);

      mockedRedis.keys.mockResolvedValue([]);
      mockedRedis.del.mockResolvedValue(1);

      const result =
        await orderService.verifyAndCreateOrderService(basePayload);

      expect(result).toEqual({
        orderId: "order_123",
        paymentId: "pay_123",
      });

      expect(mockedCart.findByIdAndDelete).toHaveBeenCalledWith("cart_1");
      expect(mockedOrder.prototype.save).toHaveBeenCalled();
    });

    it("should throw if signature invalid", async () => {
      jest
        .spyOn(crypto, "createHmac")
        .mockReturnValue(createMockHmac("wrong_signature"));

      await expect(
        orderService.verifyAndCreateOrderService(basePayload)
      ).rejects.toThrow("Transaction not legit!");
    });
  });

  describe("getOrderService", () => {
    it("should return cached order", async () => {
      mockedRedis.get.mockResolvedValue(JSON.stringify({ _id: "1" }));

      const result = await orderService.getOrderService("1");

      expect(result).toEqual({ _id: "1" });
    });

    it("should fetch order from DB if not cached", async () => {
      mockedRedis.get.mockResolvedValue(null);

      const populateFinal = jest.fn().mockResolvedValue({ _id: "1" });

      jest.spyOn(Order, "findById").mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: populateFinal,
        }),
      } as unknown as ReturnType<typeof Order.findById>);

      mockedRedis.setEx.mockResolvedValue("OK");

      const result = await orderService.getOrderService("1");

      expect(result).toEqual({ _id: "1" });
      expect(mockedRedis.setEx).toHaveBeenCalled();
    });

    it("should throw if order not found", async () => {
      mockedRedis.get.mockResolvedValue(null);

      jest.spyOn(Order, "findById").mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      } as unknown as ReturnType<typeof Order.findById>);

      await expect(orderService.getOrderService("1")).rejects.toThrow(
        "This order does not exists."
      );
    });
  });

  describe("updateOrderService", () => {
    it("should update order", async () => {
      const updatedOrder = { _id: "1", status: "delivered" };

      mockedOrder.findByIdAndUpdate.mockResolvedValue(updatedOrder as never);

      mockedRedis.del.mockResolvedValue(1);
      mockedRedis.keys.mockResolvedValue([]);

      const result = await orderService.updateOrderService("1", {
        status: "delivered",
      });

      expect(result).toEqual(updatedOrder);
      expect(mockedRedis.del).toHaveBeenCalled();
    });

    it("should throw if order not found", async () => {
      mockedOrder.findByIdAndUpdate.mockResolvedValue(null as never);

      await expect(
        orderService.updateOrderService("1", { status: "delivered" })
      ).rejects.toThrow("Order does not exists.");
    });
  });

  describe("getUserOrdersService", () => {
    it("should return cached user orders", async () => {
      mockedRedis.get.mockResolvedValue(
        JSON.stringify({ orders: [], count: 0 })
      );

      const result = await orderService.getUserOrdersService("user_1", {});

      expect(result).toEqual({ orders: [], count: 0 });
    });
  });
});
