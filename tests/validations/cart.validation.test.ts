import * as cartValidation from "../../src/validations/cart.validation";

describe("Cart Validation", () => {
  describe("addCartSchema", () => {
    it("should pass valid data", () => {
      const result = cartValidation.addCartSchema.safeParse({
        productId: "p1",
        quantity: 2,
      });

      expect(result.success).toBe(true);
    });

    it("should fail invalid quantity", () => {
      const result = cartValidation.addCartSchema.safeParse({
        productId: "p1",
        quantity: 0,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("removeCartSchema", () => {
    it("should pass valid data", () => {
      const result = cartValidation.removeCartSchema.safeParse({
        productId: "p1",
      });

      expect(result.success).toBe(true);
    });

    it("should fail empty productId", () => {
      const result = cartValidation.removeCartSchema.safeParse({
        productId: "",
      });

      expect(result.success).toBe(false);
    });
  });
});
