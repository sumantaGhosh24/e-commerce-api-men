import * as brandValidation from "../../src/validations/brand.validation";

describe("Brand Validation Schemas", () => {
  describe("brandIdSchema", () => {
    it("should pass with valid id", () => {
      const result = brandValidation.brandIdSchema.safeParse({
        id: "123",
      });

      expect(result.success).toBe(true);
    });

    it("should fail if id is empty", () => {
      const result = brandValidation.brandIdSchema.safeParse({
        id: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createBrandSchema", () => {
    const validData = {
      name: "Nike",
      image: {
        url: "https://example.com/image.jpg",
        public_id: "img123",
      },
    };

    it("should pass with valid data", () => {
      const result = brandValidation.createBrandSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should fail if name is empty", () => {
      const result = brandValidation.createBrandSchema.safeParse({
        ...validData,
        name: "",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if image is missing", () => {
      const result = brandValidation.createBrandSchema.safeParse({
        name: "Nike",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if image.public_id is empty", () => {
      const result = brandValidation.createBrandSchema.safeParse({
        ...validData,
        image: {
          url: "https://example.com/image.jpg",
          public_id: "",
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateBrandSchema", () => {
    const validData = {
      name: "Adidas",
      image: {
        url: "https://example.com/image.jpg",
        public_id: "img123",
      },
    };

    it("should pass with valid data", () => {
      const result = brandValidation.updateBrandSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should fail if name is empty", () => {
      const result = brandValidation.updateBrandSchema.safeParse({
        ...validData,
        name: "",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if image.public_id is empty", () => {
      const result = brandValidation.updateBrandSchema.safeParse({
        ...validData,
        image: {
          url: "https://example.com/image.jpg",
          public_id: "",
        },
      });

      expect(result.success).toBe(false);
    });

    it("should fail if no fields provided", () => {
      const result = brandValidation.updateBrandSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });
});
