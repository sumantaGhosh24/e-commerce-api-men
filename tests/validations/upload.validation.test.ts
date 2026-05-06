import * as uploadValidation from "../../src/validations/upload.validation";

describe("Upload Validation Schemas", () => {
  describe("deleteImageSchema", () => {
    it("should pass valid input", () => {
      const result = uploadValidation.deleteImageSchema.safeParse({
        public_id: "id",
      });
      expect(result.success).toBe(true);
    });

    it("should fail invalid input", () => {
      const result = uploadValidation.deleteImageSchema.safeParse({
        public_id: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
