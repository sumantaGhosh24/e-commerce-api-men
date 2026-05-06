import * as userValidation from "../../src/validations/user.validation";

describe("User Validation Schemas", () => {
  describe("userIdSchema", () => {
    it("should pass with valid id", () => {
      const result = userValidation.userIdSchema.safeParse({ id: "123" });
      expect(result.success).toBe(true);
    });

    it("should fail with empty id", () => {
      const result = userValidation.userIdSchema.safeParse({ id: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("userImageSchema", () => {
    it("should pass with valid image", () => {
      const result = userValidation.userImageSchema.safeParse({
        image: {
          url: "https://img.com",
          public_id: "123",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should fail if public_id missing", () => {
      const result = userValidation.userImageSchema.safeParse({
        image: {
          url: "https://img.com",
          public_id: "",
        },
      });

      expect(result.success).toBe(false);
    });

    it("should fail if image missing", () => {
      const result = userValidation.userImageSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("userDataSchema", () => {
    const validData = {
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
      dob: "2000-01-01",
      gender: "male" as const,
    };

    it("should pass with valid data", () => {
      const result = userValidation.userDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail with invalid date format", () => {
      const result = userValidation.userDataSchema.safeParse({
        ...validData,
        dob: "01-01-2000",
      });

      expect(result.success).toBe(false);
    });

    it("should fail with invalid gender", () => {
      const result = userValidation.userDataSchema.safeParse({
        ...validData,
        gender: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("should trim values", () => {
      const result = userValidation.userDataSchema.safeParse({
        ...validData,
        firstName: "  John  ",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.firstName).toBe("John");
      }
    });

    it("should fail if required fields missing", () => {
      const result = userValidation.userDataSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("userAddressSchema", () => {
    const validData = {
      city: "Kolkata",
      state: "WB",
      country: "India",
      zip: "700001",
      addressline: "Main Road",
    };

    it("should pass with valid data", () => {
      const result = userValidation.userAddressSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail if any field empty", () => {
      const result = userValidation.userAddressSchema.safeParse({
        ...validData,
        city: "",
      });

      expect(result.success).toBe(false);
    });

    it("should trim values", () => {
      const result = userValidation.userAddressSchema.safeParse({
        ...validData,
        city: "  Kolkata  ",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.city).toBe("Kolkata");
      }
    });
  });

  describe("resetPasswordSchema", () => {
    const validData = {
      previousPassword: "123456",
      newPassword: "abcdef",
      cf_newPassword: "abcdef",
    };

    it("should pass with valid data", () => {
      const result = userValidation.resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail if passwords do not match", () => {
      const result = userValidation.resetPasswordSchema.safeParse({
        ...validData,
        cf_newPassword: "wrong",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if password too short", () => {
      const result = userValidation.resetPasswordSchema.safeParse({
        previousPassword: "123",
        newPassword: "abc",
        cf_newPassword: "abc",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if fields missing", () => {
      const result = userValidation.resetPasswordSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
