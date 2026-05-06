import request from "supertest";

import app from "../../src/app";
import * as authService from "../../src/services/auth.service";

jest.mock("@arcjet/node", () => ({
  slidingWindow: jest.fn(),
}));
jest.mock("../../src/config/arcjet", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../src/middleware/security.middleware", () =>
  jest.fn((req, res, next) => next())
);
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../src/services/auth.service");

const mockUser = {
  _id: "1",
  email: "test@mail.com",
  _doc: { _id: "1", email: "test@mail.com" },
};

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/register", () => {
    it("should register user successfully", async () => {
      (authService.registerService as jest.Mock).mockResolvedValue(mockUser);
      (
        authService.sendRegisterVerificationEmailService as jest.Mock
      ).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/register")
        .send({
          email: "test@mail.com",
          mobileNumber: "1234567890",
          password: "12345678",
          cf_password: "12345678",
        })
        .expect(200);

      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app).post("/api/register").send({}).expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/register-verify", () => {
    it("should verify user successfully", async () => {
      (authService.registerVerifyService as jest.Mock).mockResolvedValue({
        accesstoken: "token",
        refreshtoken: "refresh",
        user: mockUser,
      });

      const res = await request(app)
        .get("/api/register-verify?token=123")
        .expect(200);

      expect(res.body).toHaveProperty("accesstoken");
    });

    it("should return 400 if token missing", async () => {
      const res = await request(app).get("/api/register-verify").expect(400);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("POST /api/login", () => {
    it("should login and send otp", async () => {
      (authService.loginService as jest.Mock).mockResolvedValue(mockUser);
      (authService.sendLoginOtpEmailService as jest.Mock).mockResolvedValue(
        undefined
      );

      const res = await request(app)
        .post("/api/login")
        .send({
          email: "test@mail.com",
          password: "12345678",
        })
        .expect(200);

      expect(res.body).toHaveProperty("verify", true);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app).post("/api/login").send({}).expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/login-verify", () => {
    it("should verify login successfully", async () => {
      (authService.loginVerifyService as jest.Mock).mockResolvedValue({
        accesstoken: "token",
        refreshtoken: "refresh",
        user: mockUser,
      });

      const res = await request(app)
        .post("/api/login-verify")
        .set("Cookie", ["check=token"])
        .send({ otp: 123456 })
        .expect(200);

      expect(res.body).toHaveProperty("accesstoken");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 if cookie missing", async () => {
      const res = await request(app)
        .post("/api/login-verify")
        .send({ otp: 123456 })
        .expect(400);

      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 if otp missing", async () => {
      const res = await request(app)
        .post("/api/login-verify")
        .set("Cookie", ["check=token"])
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("GET /api/refresh_token", () => {
    it("should refresh token successfully", async () => {
      (authService.refreshTokenService as jest.Mock).mockResolvedValue({
        accesstoken: "new-token",
        user: mockUser,
      });

      const res = await request(app)
        .get("/api/refresh_token")
        .set("Cookie", ["refreshtoken=token"])
        .expect(200);

      expect(res.body).toHaveProperty("accesstoken");
    });

    it("should return 400 if token missing", async () => {
      const res = await request(app).get("/api/refresh_token").expect(400);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("GET /api/logout", () => {
    it("should logout successfully", async () => {
      const res = await request(app).get("/api/logout").expect(200);

      expect(res.body).toHaveProperty("message", "Logged Out.");
    });
  });

  describe("POST /api/forgot-password", () => {
    it("should send forgot password email", async () => {
      (authService.forgotPasswordService as jest.Mock).mockResolvedValue(
        "token"
      );

      const res = await request(app)
        .post("/api/forgot-password")
        .send({ email: "test@mail.com" })
        .expect(200);

      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .post("/api/forgot-password")
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/validate-confirm-forgot-password", () => {
    it("should validate token successfully", async () => {
      (
        authService.validateConfirmForgotPasswordService as jest.Mock
      ).mockResolvedValue(true);

      const res = await request(app)
        .get("/api/validate-confirm-forgot-password?token=123")
        .expect(200);

      expect(res.body).toHaveProperty("message");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 if token missing", async () => {
      const res = await request(app)
        .get("/api/validate-confirm-forgot-password")
        .expect(400);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("POST /api/confirm-forgot-password", () => {
    it("should reset password successfully", async () => {
      (authService.confirmForgotPasswordService as jest.Mock).mockResolvedValue(
        true
      );

      const res = await request(app)
        .post("/api/confirm-forgot-password")
        .set("Cookie", ["token=123"])
        .send({
          password: "12345678",
          cf_password: "12345678",
        })
        .expect(200);

      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 if token missing", async () => {
      const res = await request(app)
        .post("/api/confirm-forgot-password")
        .send({
          password: "12345678",
          cf_password: "12345678",
        })
        .expect(400);

      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .post("/api/confirm-forgot-password")
        .set("Cookie", ["token=123"])
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });
});
