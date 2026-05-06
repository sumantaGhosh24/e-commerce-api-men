import * as categoryValidation from "../../src/validations/category.validation";

describe("Category Validation Schemas", () => {
  describe("categoryIdSchema", () => {
    it("should pass valid id", () => {
      const result = categoryValidation.categoryIdSchema.safeParse({
        id: "123",
      });
      expect(result.success).toBe(true);
    });

    it("should fail empty id", () => {
      const result = categoryValidation.categoryIdSchema.safeParse({ id: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("createCategorySchema", () => {
    it("should pass valid data", () => {
      const result = categoryValidation.createCategorySchema.safeParse({
        name: "Shoes",
        image: { url: "img", public_id: "1" },
      });

      expect(result.success).toBe(true);
    });

    it("should fail without name", () => {
      const result = categoryValidation.createCategorySchema.safeParse({
        image: { url: "img", public_id: "1" },
      });

      expect(result.success).toBe(false);
    });

    it("should fail invalid image", () => {
      const result = categoryValidation.createCategorySchema.safeParse({
        name: "Shoes",
        image: { url: "", public_id: "" },
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateCategorySchema", () => {
    it("should pass valid update", () => {
      const result = categoryValidation.updateCategorySchema.safeParse({
        name: "Updated",
        image: { url: "img", public_id: "1" },
      });

      expect(result.success).toBe(true);
    });

    it("should fail empty object", () => {
      const result = categoryValidation.updateCategorySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should fail invalid fields", () => {
      const result = categoryValidation.updateCategorySchema.safeParse({
        name: "",
        image: { url: "", public_id: "" },
      });

      expect(result.success).toBe(false);
    });
  });
});
