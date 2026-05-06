import * as reviewValidation from "../../src/validations/review.validation";

describe("Review Validation Schemas", () => {
  describe("reviewProductSchema", () => {
    it("should pass with valid product id", () => {
      const result = reviewValidation.reviewProductSchema.safeParse({
        product: "p1",
      });

      expect(result.success).toBe(true);
    });

    it("should fail if product is empty", () => {
      const result = reviewValidation.reviewProductSchema.safeParse({
        product: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("reviewUserSchema", () => {
    it("should pass with valid user id", () => {
      const result = reviewValidation.reviewUserSchema.safeParse({
        user: "u1",
      });

      expect(result.success).toBe(true);
    });

    it("should fail if user is empty", () => {
      const result = reviewValidation.reviewUserSchema.safeParse({
        user: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createReviewSchema", () => {
    const validData = {
      product: "p1",
      comment: "Great product",
      rating: 5,
    };

    it("should pass with valid data", () => {
      const result = reviewValidation.createReviewSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should fail if product is empty", () => {
      const result = reviewValidation.createReviewSchema.safeParse({
        ...validData,
        product: "",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if comment is empty", () => {
      const result = reviewValidation.createReviewSchema.safeParse({
        ...validData,
        comment: "",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if rating is less than 1", () => {
      const result = reviewValidation.createReviewSchema.safeParse({
        ...validData,
        rating: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should fail if rating is greater than 5", () => {
      const result = reviewValidation.createReviewSchema.safeParse({
        ...validData,
        rating: 6,
      });

      expect(result.success).toBe(false);
    });

    it("should fail if rating is not a number", () => {
      const result = reviewValidation.createReviewSchema.safeParse({
        ...validData,
        rating: "five",
      });

      expect(result.success).toBe(false);
    });
  });
});
