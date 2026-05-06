import * as reviewService from "../../src/services/review.service";
import Review from "../../src/models/review.model";
import redisClient from "../../src/config/redis";

jest.mock("../../src/models/review.model");
jest.mock("../../src/config/redis");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../src/utils/pagination", () => {
  return {
    APIFeatures: jest.fn().mockImplementation(query => {
      return {
        query,
        paginating() {
          return this;
        },
        sorting() {
          return this;
        },
        searching() {
          return this;
        },
        filtering() {
          return this;
        },
      };
    }),
  };
});

const mockQueryChain = (data: unknown) => ({
  populate: jest.fn().mockReturnThis(),
  then: (resolve: (_val: unknown) => void) => resolve(data),
});

describe("Review Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getReviewsService", () => {
    it("should return cached reviews", async () => {
      const mock = { reviews: [], count: 0 };

      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mock));

      const result = await reviewService.getReviewsService({});

      expect(result).toEqual(mock);
    });

    it("should fetch reviews from DB and cache them", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const data = [{ _id: "1" }];

      (Review.find as jest.Mock).mockImplementation(() => mockQueryChain(data));

      jest.spyOn(Promise, "allSettled").mockResolvedValue([
        { status: "fulfilled", value: data },
        { status: "fulfilled", value: data },
      ] as PromiseSettledResult<unknown>[]);

      const result = await reviewService.getReviewsService({});

      expect(result.reviews).toEqual(data);
      expect(result.count).toBe(data.length);
      expect(redisClient.setEx).toHaveBeenCalled();
    });

    it("should throw error if DB fails", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      (Review.find as jest.Mock).mockImplementation(() => {
        throw new Error("DB error");
      });

      await expect(reviewService.getReviewsService({})).rejects.toThrow(
        "DB error"
      );
    });
  });

  describe("getProductReviewsService", () => {
    it("should return cached product reviews", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue("cached");

      const result = await reviewService.getProductReviewsService("p1");

      expect(result).toBe("cached");
    });

    it("should fetch product reviews from DB and cache them", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const data = [{ _id: "1" }];

      (Review.findById as jest.Mock).mockImplementation(() =>
        mockQueryChain(data)
      );

      const result = await reviewService.getProductReviewsService("p1");

      expect(result).toEqual(data);
      expect(redisClient.setEx).toHaveBeenCalled();
    });

    it("should throw error if DB fails", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      (Review.findById as jest.Mock).mockImplementation(() => {
        throw new Error("DB error");
      });

      await expect(
        reviewService.getProductReviewsService("p1")
      ).rejects.toThrow("DB error");
    });
  });

  describe("getUserReviewsService", () => {
    it("should return cached user reviews", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue("cached");

      const result = await reviewService.getUserReviewsService("u1");

      expect(result).toBe("cached");
    });

    it("should fetch user reviews from DB and cache them", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const data = [{ _id: "1" }];

      (Review.find as jest.Mock).mockImplementation(query => {
        if (query && query.user === "u1") {
          return mockQueryChain(data);
        }
        return mockQueryChain([]);
      });

      const result = await reviewService.getUserReviewsService("u1");

      expect(result).toEqual(data);
      expect(redisClient.setEx).toHaveBeenCalled();
    });

    it("should throw error if DB fails", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      (Review.find as jest.Mock).mockImplementation(() => {
        throw new Error("DB error");
      });

      await expect(reviewService.getUserReviewsService("u1")).rejects.toThrow(
        "DB error"
      );
    });
  });

  describe("createReviewService", () => {
    it("should create review and clear cache", async () => {
      const save = jest.fn();

      (Review as unknown as jest.Mock).mockImplementation(() => ({
        save,
      }));

      (redisClient.del as jest.Mock).mockResolvedValue(null);
      (redisClient.keys as jest.Mock).mockResolvedValue([]);

      const result = await reviewService.createReviewService(
        "p1",
        "u1",
        "Great product",
        5
      );

      expect(save).toHaveBeenCalled();
      expect(redisClient.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should clear cache keys if present", async () => {
      const save = jest.fn();

      (Review as unknown as jest.Mock).mockImplementation(() => ({
        save,
      }));

      (redisClient.del as jest.Mock).mockResolvedValue(null);
      (redisClient.keys as jest.Mock).mockResolvedValue(["reviews:1"]);

      await reviewService.createReviewService("p1", "u1", "Nice", 4);

      expect(redisClient.del).toHaveBeenCalled();
    });

    it("should throw error if save fails", async () => {
      (Review as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("Save error")),
      }));

      await expect(
        reviewService.createReviewService("p1", "u1", "Bad", 1)
      ).rejects.toThrow("Save error");
    });
  });
});
