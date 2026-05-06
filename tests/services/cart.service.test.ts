import Cart from "../../src/models/cart.model";
import Product from "../../src/models/product.model";
import redisClient from "../../src/config/redis";
import { CACHE_KEYS } from "../../src/config/cacheKeys";
import * as cartService from "../../src/services/cart.service";

jest.mock("../../src/models/cart.model");
jest.mock("../../src/models/product.model");
jest.mock("../../src/config/redis");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockedCart = Cart as jest.Mocked<typeof Cart>;
const mockedProduct = Product as jest.Mocked<typeof Product>;
const mockedRedis = redisClient as jest.Mocked<typeof redisClient>;

type MockCart = {
  products: Array<{
    product: string;
    quantity?: number;
    price?: number;
    taxPrice?: number;
    shippingPrice?: number;
    totalPrice?: number;
  }>;
  save: jest.Mock;
};

describe("Cart Service", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getCartService", () => {
    it("returns cached cart", async () => {
      const fakeCart = { user: "1", products: [] };

      mockedRedis.get.mockResolvedValue(JSON.stringify(fakeCart));

      const result = await cartService.getCartService("1");

      expect(result).toEqual(fakeCart);
    });

    it("fetches from DB and caches", async () => {
      const fakeCart = { user: "1", products: [] };

      mockedRedis.get.mockResolvedValue(null);

      const populateMock = jest.fn().mockResolvedValue(fakeCart);

      const mockFindOne = mockedCart.findOne as jest.Mock;
      mockFindOne.mockReturnValue({
        populate: populateMock,
        lean: jest.fn().mockResolvedValue(fakeCart),
      });

      const result = await cartService.getCartService("1");

      expect(populateMock).toHaveBeenCalledWith("products.product");
      expect(mockedRedis.setEx).toHaveBeenCalled();
      expect(result).toEqual(fakeCart);
    });

    it("throws error", async () => {
      mockedRedis.get.mockRejectedValue(new Error("fail"));

      await expect(cartService.getCartService("1")).rejects.toThrow();
    });
  });

  describe("addCartService", () => {
    it("returns error if product not found", async () => {
      mockedCart.findOne.mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue(null);

      const mockFindById = mockedProduct.findById as jest.Mock;
      mockFindById.mockReturnValue({ select: mockSelect });

      const result = await cartService.addCartService({
        userId: "1",
        productId: "p1",
        quantity: 2,
      });

      expect(result).toEqual({
        message: "Product not found.",
        error: "NOT_FOUND",
      });
    });

    it("creates new cart", async () => {
      mockedCart.findOne.mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue({ price: 100 });

      const mockFindById = mockedProduct.findById as jest.Mock;
      mockFindById.mockReturnValue({ select: mockSelect });

      mockedCart.create.mockResolvedValue(
        {} as unknown as ReturnType<typeof Cart.create>
      );

      await cartService.addCartService({
        userId: "1",
        productId: "p1",
        quantity: 1,
      });

      expect(mockedCart.create).toHaveBeenCalled();
      expect(mockedRedis.del).toHaveBeenCalledWith(CACHE_KEYS.USER_CART("1"));
    });

    it("updates existing product", async () => {
      const cart: MockCart = {
        products: [{ product: "p1", quantity: 1, price: 100 }],
        save: jest.fn(),
      };

      mockedCart.findOne.mockResolvedValue(cart);

      const mockSelect = jest.fn().mockResolvedValue({ price: 100 });
      const mockFindById = mockedProduct.findById as jest.Mock;
      mockFindById.mockReturnValue({ select: mockSelect });

      await cartService.addCartService({
        userId: "1",
        productId: "p1",
        quantity: 5,
      });

      expect(cart.products[0].quantity).toBe(5);
      expect(cart.save).toHaveBeenCalled();
    });

    it("adds new product to existing cart", async () => {
      const cart: MockCart = {
        products: [],
        save: jest.fn(),
      };

      mockedCart.findOne.mockResolvedValue(cart);

      const mockSelect = jest.fn().mockResolvedValue({ price: 100 });
      const mockFindById = mockedProduct.findById as jest.Mock;
      mockFindById.mockReturnValue({ select: mockSelect });

      await cartService.addCartService({
        userId: "1",
        productId: "p2",
        quantity: 1,
      });

      expect(cart.products.length).toBe(1);
      expect(cart.save).toHaveBeenCalled();
    });
  });

  describe("removeCartService", () => {
    it("returns error if cart not found", async () => {
      mockedCart.findOne.mockResolvedValue(null);

      const result = await cartService.removeCartService({
        userId: "1",
        productId: "p1",
      });

      expect(result).toEqual({
        message: "Cart does not exists.",
        error: "NOT_FOUND",
      });
    });

    it("removes product", async () => {
      const cart: MockCart = {
        products: [{ product: "p1" }, { product: "p2" }],
        save: jest.fn(),
      };

      mockedCart.findOne.mockResolvedValue(cart);

      await cartService.removeCartService({
        userId: "1",
        productId: "p1",
      });

      expect(cart.products.length).toBe(1);
      expect(cart.save).toHaveBeenCalled();
      expect(mockedRedis.del).toHaveBeenCalled();
    });
  });

  describe("clearCartService", () => {
    it("clears cart", async () => {
      mockedCart.findOneAndDelete.mockResolvedValue({});

      const result = await cartService.clearCartService("1");

      expect(result).toBe(true);
      expect(mockedRedis.del).toHaveBeenCalledWith(CACHE_KEYS.USER_CART("1"));
    });
  });
});
