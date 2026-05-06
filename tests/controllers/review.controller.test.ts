import { Request, Response } from "express";

import * as reviewController from "../../src/controllers/review.controller";
import * as reviewService from "../../src/services/review.service";
import * as validations from "../../src/validations/review.validation";
import * as formatUtils from "../../src/utils/format";
import { IReqAuth } from "../../src/types";
import { IUser } from "../../src/models/user.model";

jest.mock("../../src/services/review.service");
jest.mock("../../src/validations/review.validation");
jest.mock("../../src/utils/format");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

const mockResponse = (): MockResponse => {
  const res = {} as MockResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (data: Partial<Request>): Request =>
  data as unknown as Request;

const mockUser: Partial<IUser> = {
  _id: "user1",
  email: "test@test.com",
  mobileNumber: "1234567890",
  password: "hashed",
  firstName: "Test",
  lastName: "User",
  image: { url: "img", public_id: "1" },
  role: "user",
  dob: "2000-01-01",
  gender: "male",
  city: "Kolkata",
  state: "WB",
  country: "India",
  zip: "700001",
  addressline: "Street 1",
  status: "active",
  username: "test",
};

const mockAuthRequest = (data: Partial<IReqAuth>): IReqAuth =>
  ({
    ...data,
    user: mockUser,
  }) as IReqAuth;

describe("Review Controller", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getReviews", () => {
    it("should return reviews", async () => {
      (reviewService.getReviewsService as jest.Mock).mockResolvedValue({
        reviews: [],
        count: 0,
      });

      const res = mockResponse();

      await reviewController.getReviews(mockRequest({ query: {} }), res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle error", async () => {
      (reviewService.getReviewsService as jest.Mock).mockRejectedValue(
        new Error("Error")
      );

      const res = mockResponse();

      await reviewController.getReviews(mockRequest({ query: {} }), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getProductReviews", () => {
    it("should fail validation", async () => {
      (validations.reviewProductSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "err",
      });

      (formatUtils.formatValidationError as jest.Mock).mockReturnValue(
        "validation error"
      );

      const res = mockResponse();

      await reviewController.getProductReviews(
        mockRequest({ params: { product: "" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return reviews", async () => {
      (validations.reviewProductSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { product: "p1" },
      });

      (reviewService.getProductReviewsService as jest.Mock).mockResolvedValue([
        { _id: "1" },
      ]);

      const res = mockResponse();

      await reviewController.getProductReviews(
        mockRequest({ params: { product: "p1" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle error", async () => {
      (validations.reviewProductSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { product: "p1" },
      });

      (reviewService.getProductReviewsService as jest.Mock).mockRejectedValue(
        new Error("Error")
      );

      const res = mockResponse();

      await reviewController.getProductReviews(
        mockRequest({ params: { product: "p1" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getUserReviews", () => {
    it("should fail validation", async () => {
      (validations.reviewUserSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "err",
      });

      const res = mockResponse();

      await reviewController.getUserReviews(
        mockRequest({ params: { user: "" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return reviews", async () => {
      (validations.reviewUserSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { user: "u1" },
      });

      (reviewService.getUserReviewsService as jest.Mock).mockResolvedValue([
        { _id: "1" },
      ]);

      const res = mockResponse();

      await reviewController.getUserReviews(
        mockRequest({ params: { user: "u1" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle error", async () => {
      (validations.reviewUserSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { user: "u1" },
      });

      (reviewService.getUserReviewsService as jest.Mock).mockRejectedValue(
        new Error("Error")
      );

      const res = mockResponse();

      await reviewController.getUserReviews(
        mockRequest({ params: { user: "u1" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createReview", () => {
    it("should fail validation", async () => {
      (validations.createReviewSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "err",
      });

      const res = mockResponse();

      await reviewController.createReview(mockAuthRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create review", async () => {
      (validations.createReviewSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { product: "p1", comment: "good", rating: 5 },
      });

      (reviewService.createReviewService as jest.Mock).mockResolvedValue({
        comment: "good",
      });

      const res = mockResponse();

      await reviewController.createReview(mockAuthRequest({ body: {} }), res);

      expect(reviewService.createReviewService).toHaveBeenCalledWith(
        "p1",
        "user1",
        "good",
        5
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Review Created successfully.",
      });
    });

    it("should handle error", async () => {
      (validations.createReviewSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { product: "p1", comment: "good", rating: 5 },
      });

      (reviewService.createReviewService as jest.Mock).mockRejectedValue(
        new Error("Error")
      );

      const res = mockResponse();

      await reviewController.createReview(mockAuthRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
