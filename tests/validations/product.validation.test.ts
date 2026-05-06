import * as productValidation from "../../src/validations/product.validation";

describe("Product Validation Schemas", () => {
  describe("productIdSchema", () => {
    it("should pass valid id", () => {
      const result = productValidation.productIdSchema.safeParse({ id: "123" });
      expect(result.success).toBe(true);
    });

    it("should fail empty id", () => {
      const result = productValidation.productIdSchema.safeParse({ id: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("createProductSchema", () => {
    const validData = {
      title: "Test",
      description: "Desc",
      content: "Content",
      category: "cat",
      brand: "brand",
      price: 10,
      checked: true,
      stock: 1,
      sold: 0,
      images: [{ url: "img", public_id: "1" }],
    };

    it("should pass valid data", () => {
      const result = productValidation.createProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail missing required fields", () => {
      const result = productValidation.createProductSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should fail negative price", () => {
      const result = productValidation.createProductSchema.safeParse({
        ...validData,
        price: -1,
      });

      expect(result.success).toBe(false);
    });

    it("should fail empty images", () => {
      const result = productValidation.createProductSchema.safeParse({
        ...validData,
        images: [],
      });

      expect(result.success).toBe(false);
    });

    it("should trim title", () => {
      const result = productValidation.createProductSchema.safeParse({
        ...validData,
        title: "   Hello   ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Hello");
      }
    });
  });

  describe("updateProductSchema", () => {
    it("should pass with one field", () => {
      const result = productValidation.updateProductSchema.safeParse({
        title: "New",
      });
      expect(result.success).toBe(true);
    });

    it("should fail with empty object", () => {
      const result = productValidation.updateProductSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should fail invalid field", () => {
      const result = productValidation.updateProductSchema.safeParse({
        price: -10,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("addProductImageSchema", () => {
    it("should pass valid images", () => {
      const result = productValidation.addProductImageSchema.safeParse({
        images: [{ url: "img", public_id: "1" }],
      });

      expect(result.success).toBe(true);
    });

    it("should fail invalid structure", () => {
      const result = productValidation.addProductImageSchema.safeParse({
        images: [{ url: "img" }],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("removeProductImageSchema", () => {
    it("should pass valid public_id", () => {
      const result = productValidation.removeProductImageSchema.safeParse({
        public_id: "1",
      });

      expect(result.success).toBe(true);
    });

    it("should fail empty public_id", () => {
      const result = productValidation.removeProductImageSchema.safeParse({
        public_id: "",
      });

      expect(result.success).toBe(false);
    });
  });
});
