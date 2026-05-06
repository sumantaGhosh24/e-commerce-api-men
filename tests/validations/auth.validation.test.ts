import * as authValidation from "../../src/validations/auth.validation";

describe("Auth Validation Schemas", () => {
  describe("registerSchema", () => {
    const validData = {
      email: "test@mail.com",
      mobileNumber: "1234567890",
      password: "12345678",
      cf_password: "12345678",
    };

    it("should pass with valid data", () => {
      const result = authValidation.registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail if email is invalid", () => {
      const result = authValidation.registerSchema.safeParse({
        ...validData,
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if mobile number is not 10 digits", () => {
      const result = authValidation.registerSchema.safeParse({
        ...validData,
        mobileNumber: "12345",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if mobile contains non-numeric characters", () => {
      const result = authValidation.registerSchema.safeParse({
        ...validData,
        mobileNumber: "12345abcde",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if password is too short", () => {
      const result = authValidation.registerSchema.safeParse({
        ...validData,
        password: "123",
        cf_password: "123",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if passwords do not match", () => {
      const result = authValidation.registerSchema.safeParse({
        ...validData,
        cf_password: "different",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should pass with valid data", () => {
      const result = authValidation.loginSchema.safeParse({
        email: "test@mail.com",
        password: "123456",
      });

      expect(result.success).toBe(true);
    });

    it("should fail if email is invalid", () => {
      const result = authValidation.loginSchema.safeParse({
        email: "wrong",
        password: "123456",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if password is empty", () => {
      const result = authValidation.loginSchema.safeParse({
        email: "test@mail.com",
        password: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should pass with valid email", () => {
      const result = authValidation.forgotPasswordSchema.safeParse({
        email: "test@mail.com",
      });

      expect(result.success).toBe(true);
    });

    it("should fail with invalid email", () => {
      const result = authValidation.forgotPasswordSchema.safeParse({
        email: "invalid",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("confirmForgotPasswordSchema", () => {
    const validData = {
      password: "12345678",
      cf_password: "12345678",
    };

    it("should pass with valid data", () => {
      const result =
        authValidation.confirmForgotPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail if password too short", () => {
      const result = authValidation.confirmForgotPasswordSchema.safeParse({
        password: "123",
        cf_password: "123",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if passwords do not match", () => {
      const result = authValidation.confirmForgotPasswordSchema.safeParse({
        password: "12345678",
        cf_password: "wrong",
      });

      expect(result.success).toBe(false);
    });
  });
});
