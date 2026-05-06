import { Request, Response } from "express";

import * as authController from "../../src/controllers/auth.controller";
import * as authService from "../../src/services/auth.service";
import * as jwtUtils from "../../src/utils/jwt";
import * as formatUtils from "../../src/utils/format";
import * as validations from "../../src/validations/auth.validation";

jest.mock("../../src/services/auth.service");
jest.mock("../../src/utils/jwt");
jest.mock("../../src/utils/format");
jest.mock("../../src/validations/auth.validation");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockRequest = (data: Partial<Request>): Request => {
  return data as unknown as Request;
};

describe("Auth Controller", () => {
  afterEach(() => jest.clearAllMocks());

  describe("register", () => {
    it("should return 400 if validation fails", async () => {
      (validations.registerSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: "error",
      });

      (formatUtils.formatValidationError as jest.Mock).mockReturnValue("err");

      const res = mockResponse();
      await authController.register(mockRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should register successfully", async () => {
      (validations.registerSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          email: "a@mail.com",
          mobileNumber: "1234567890",
          password: "12345678",
        },
      });

      (authService.registerService as jest.Mock).mockResolvedValue({
        email: "a@mail.com",
      });

      const res = mockResponse();
      await authController.register(mockRequest({ body: {} }), res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    it("should return 500 on error", async () => {
      (validations.registerSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          email: "a@mail.com",
          mobileNumber: "1234567890",
          password: "12345678",
        },
      });

      (authService.registerService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = mockResponse();
      await authController.register(mockRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("registerVerify", () => {
    it("should return 400 if token is missing", async () => {
      const req = mockRequest({ query: {} });
      const res = mockResponse();

      await authController.registerVerify(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    it("should verify user successfully", async () => {
      const mockData = {
        accesstoken: "access-token",
        refreshtoken: "refresh-token",
        user: {
          _doc: {
            email: "test@mail.com",
            _id: "1",
          },
        },
      };

      (authService.registerVerifyService as jest.Mock).mockResolvedValue(
        mockData
      );

      const req = mockRequest({
        query: { token: "valid-token" },
      });
      const res = mockResponse();

      await authController.registerVerify(req, res);

      expect(authService.registerVerifyService).toHaveBeenCalledWith(
        "valid-token"
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshtoken",
        "refresh-token",
        expect.objectContaining({
          httpOnly: true,
        })
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accesstoken: "access-token",
          email: "test@mail.com",
        })
      );
    });

    it("should return 500 if service throws error", async () => {
      (authService.registerVerifyService as jest.Mock).mockRejectedValue(
        new Error("Invalid token")
      );

      const req = mockRequest({
        query: { token: "bad-token" },
      });
      const res = mockResponse();

      await authController.registerVerify(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe("login", () => {
    it("should return 400 if validation fails", async () => {
      (validations.loginSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      const res = mockResponse();
      await authController.login(mockRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should login and send otp", async () => {
      (validations.loginSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { email: "a", password: "b" },
      });

      (authService.loginService as jest.Mock).mockResolvedValue({
        _id: "1",
        email: "a",
      });

      (jwtUtils.createAccessToken as jest.Mock).mockReturnValue("token");

      const res = mockResponse();
      await authController.login(mockRequest({ body: {} }), res);

      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ verify: true })
      );
    });
  });

  describe("loginVerify", () => {
    it("should return 400 if no cookie", async () => {
      const res = mockResponse();
      await authController.loginVerify(
        mockRequest({ cookies: {}, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if otp missing", async () => {
      const res = mockResponse();
      await authController.loginVerify(
        mockRequest({ cookies: { check: "t" }, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should verify login", async () => {
      (authService.loginVerifyService as jest.Mock).mockResolvedValue({
        accesstoken: "at",
        refreshtoken: "rt",
        user: { _doc: { email: "a" } },
      });

      const res = mockResponse();
      await authController.loginVerify(
        mockRequest({ cookies: { check: "t" }, body: { otp: 123456 } }),
        res
      );

      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("refresh_token", () => {
    it("should return 400 if no token", async () => {
      const res = mockResponse();
      await authController.refresh_token(mockRequest({ cookies: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should refresh token", async () => {
      (authService.refreshTokenService as jest.Mock).mockResolvedValue({
        accesstoken: "new",
        user: { _doc: { email: "a" } },
      });

      const res = mockResponse();
      await authController.refresh_token(
        mockRequest({ cookies: { refreshtoken: "rt" } }),
        res
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ accesstoken: "new" })
      );
    });
  });

  describe("logout", () => {
    it("should clear refreshtoken cookie and return success message", () => {
      const req = mockRequest({});
      const res = mockResponse();

      authController.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith("refreshtoken", {
        path: "/api/v1/refresh_token",
      });

      expect(res.json).toHaveBeenCalledWith({
        message: "Logged Out.",
      });
    });

    it("should handle errors and return 500", () => {
      const req = mockRequest({});

      const res = mockResponse();

      (res.clearCookie as jest.Mock).mockImplementation(() => {
        throw new Error("fail");
      });

      authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe("forgotPassword", () => {
    it("should return 400 if validation fails", async () => {
      (validations.forgotPasswordSchema.safeParse as jest.Mock).mockReturnValue(
        {
          success: false,
          error: "validation error",
        }
      );

      (formatUtils.formatValidationError as jest.Mock).mockReturnValue(
        "Invalid email"
      );

      const req = mockRequest({ body: {} });
      const res = mockResponse();

      await authController.forgotPassword(req, res);

      expect(validations.forgotPasswordSchema.safeParse).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation failed",
          message: "Invalid email",
        })
      );
    });

    it("should send forgot password email successfully", async () => {
      (validations.forgotPasswordSchema.safeParse as jest.Mock).mockReturnValue(
        {
          success: true,
          data: { email: "test@mail.com" },
        }
      );

      (authService.forgotPasswordService as jest.Mock).mockResolvedValue(
        "token"
      );

      const req = mockRequest({
        body: { email: "test@mail.com" },
      });
      const res = mockResponse();

      await authController.forgotPassword(req, res);

      expect(authService.forgotPasswordService).toHaveBeenCalledWith(
        "test@mail.com"
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    it("should return 500 if service throws error", async () => {
      (validations.forgotPasswordSchema.safeParse as jest.Mock).mockReturnValue(
        {
          success: true,
          data: { email: "test@mail.com" },
        }
      );

      (authService.forgotPasswordService as jest.Mock).mockRejectedValue(
        new Error("Email does not exist")
      );

      const req = mockRequest({
        body: { email: "test@mail.com" },
      });
      const res = mockResponse();

      await authController.forgotPassword(req, res);

      expect(authService.forgotPasswordService).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe("validateConfirmForgotPassword", () => {
    it("should return 400 if no token", async () => {
      const res = mockResponse();

      await authController.validateConfirmForgotPassword(
        mockRequest({ query: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should validate successfully", async () => {
      (
        authService.validateConfirmForgotPasswordService as jest.Mock
      ).mockResolvedValue(true);

      const res = mockResponse();

      await authController.validateConfirmForgotPassword(
        mockRequest({ query: { token: "t" } }),
        res
      );

      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("confirmForgotPassword", () => {
    it("should return 400 if no token", async () => {
      (
        validations.confirmForgotPasswordSchema.safeParse as jest.Mock
      ).mockReturnValue({
        success: true,
        data: { password: "12345678", cf_password: "12345678" },
      });

      const res = mockResponse();

      await authController.confirmForgotPassword(
        mockRequest({ cookies: {}, body: {} }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reset password", async () => {
      (
        validations.confirmForgotPasswordSchema.safeParse as jest.Mock
      ).mockReturnValue({
        success: true,
        data: { password: "12345678", cf_password: "12345678" },
      });

      const res = mockResponse();

      await authController.confirmForgotPassword(
        mockRequest({ cookies: { token: "t" }, body: {} }),
        res
      );

      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});
