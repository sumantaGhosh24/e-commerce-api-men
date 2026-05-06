import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User, { IUser } from "../../src/models/user.model";
import * as authService from "../../src/services/auth.service";
import * as jwtUtils from "../../src/utils/jwt";

jest.mock("resend", () => {
  const send = jest.fn();
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send,
      },
    })),
    sendMock: send,
  };
});
const { sendMock: sendEmailMock } = jest.requireMock("resend") as {
  sendMock: jest.Mock;
};
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../src/models/user.model");
jest.mock("../../src/utils/jwt");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockUser = {
  _id: "user1",
  email: "test@mail.com",
  password: "hashed",
  status: "active",
  save: jest.fn(),
};

const createMockUser = (overrides: Partial<IUser> = {}): IUser => {
  return {
    _id: "user1",
    email: "test@mail.com",
    mobileNumber: "1234567890",
    password: "hashed",
    firstName: "Test",
    lastName: "User",
    username: "testuser",
    image: { url: "img", public_id: "1" },
    dob: "2000-01-01",
    gender: "male",
    city: "City",
    state: "State",
    country: "Country",
    zip: "123456",
    addressline: "Address",
    status: "active",
    role: "user",
    _doc: {
      email: "test@mail.com",
      _id: "user1",
    },
    ...overrides,
  } as IUser;
};

describe("Auth Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerService", () => {
    it("should throw if email exists", async () => {
      (User.findOne as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        authService.registerService({
          email: "a@mail.com",
          mobileNumber: "1234567890",
          password: "pass",
        })
      ).rejects.toThrow("This email address already registered");
    });

    it("should throw if mobile exists", async () => {
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(true);

      await expect(
        authService.registerService({
          email: "a@mail.com",
          mobileNumber: "1234567890",
          password: "pass",
        })
      ).rejects.toThrow("This mobile number already registered");
    });

    it("should create user successfully", async () => {
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      const saveMock = jest.fn();
      (User as unknown as jest.Mock).mockImplementation(() => ({
        ...mockUser,
        save: saveMock,
      }));

      const result = await authService.registerService({
        email: "a@mail.com",
        mobileNumber: "1234567890",
        password: "pass",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("pass", 10);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("sendRegisterVerificationEmailService", () => {
    beforeEach(() => {
      sendEmailMock.mockResolvedValue({ error: null });
    });

    it("should send verification email and return token", async () => {
      const mockToken = "verification-token";

      (jwtUtils.createAccessToken as jest.Mock).mockReturnValue(mockToken);

      const user = createMockUser();

      const result =
        await authService.sendRegisterVerificationEmailService(user);

      expect(jwtUtils.createAccessToken).toHaveBeenCalledWith({
        id: "user1",
      });

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@mail.com",
        })
      );

      expect(result).toBe(mockToken);
    });

    it("should throw error if email sending fails", async () => {
      (jwtUtils.createAccessToken as jest.Mock).mockReturnValue("token");

      sendEmailMock.mockResolvedValueOnce({ error: "failed" });

      const user = createMockUser();

      await expect(
        authService.sendRegisterVerificationEmailService(user)
      ).rejects.toThrow("Error sending email.");
    });
  });

  describe("registerVerifyService", () => {
    it("should resolve valid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(null, { id: "user1" })
      );

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      (jwtUtils.createAccessToken as jest.Mock).mockReturnValue("access");
      (jwtUtils.createRefreshToken as jest.Mock).mockReturnValue("refresh");

      const res = await authService.registerVerifyService("token");

      expect(res.accesstoken).toBe("access");
      expect(res.refreshtoken).toBe("refresh");
      expect(res.user).toEqual(mockUser);
    });

    it("should reject invalid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(new Error("invalid"), null)
      );

      await expect(
        authService.registerVerifyService("bad")
      ).rejects.toBeDefined();
    });

    it("should reject if user not found", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(null, { id: "user1" })
      );

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.registerVerifyService("token")
      ).rejects.toBeDefined();
    });
  });

  describe("loginService", () => {
    it("should throw if user not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.loginService("a@mail.com", "pass")
      ).rejects.toThrow("User doest not exists.");
    });

    it("should throw if inactive user", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: "inactive",
      });

      await expect(
        authService.loginService("a@mail.com", "pass")
      ).rejects.toThrow("This email not verified");
    });

    it("should throw if password mismatch", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.loginService("a@mail.com", "pass")
      ).rejects.toThrow("Invalid Login Credentials.");
    });

    it("should login successfully", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.loginService("a@mail.com", "pass");

      expect(result).toEqual(mockUser);
    });
  });

  describe("sendLoginOtpEmailService", () => {
    beforeEach(() => {
      sendEmailMock.mockResolvedValue({ error: null });
    });

    it("should send OTP email successfully", async () => {
      const user = createMockUser({
        email: "test@mail.com",
      });

      const otp = 123456;

      await authService.sendLoginOtpEmailService(user, otp);

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: "test@mail.com",
          subject: expect.any(String),
          html: expect.stringContaining(String(otp)),
        })
      );
    });

    it("should throw error if email sending fails", async () => {
      sendEmailMock.mockResolvedValueOnce({ error: "failed" });

      const user = createMockUser({
        email: "test@mail.com",
      });

      const otp = 123456;

      await expect(
        authService.sendLoginOtpEmailService(user, otp)
      ).rejects.toThrow("Error sending email.");
    });
  });

  describe("loginVerifyService", () => {
    it("should verify otp correctly", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(null, { id: "user1", num: 123456 })
      );

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      (jwtUtils.createAccessToken as jest.Mock).mockReturnValue("access");
      (jwtUtils.createRefreshToken as jest.Mock).mockReturnValue("refresh");

      const res = await authService.loginVerifyService("token", 123456);

      expect(res.accesstoken).toBe("access");
      expect(res.refreshtoken).toBe("refresh");
    });

    it("should reject wrong otp", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(null, { id: "user1", num: 111111 })
      );

      await expect(
        authService.loginVerifyService("token", 123456)
      ).rejects.toThrow("Invalid otp");
    });

    it("should reject if user not found", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(null, { id: "user1", num: 123456 })
      );

      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.loginVerifyService("token", 123456)
      ).rejects.toThrow();
    });

    it("should reject invalid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(new Error("invalid"), null)
      );

      await expect(
        authService.loginVerifyService("bad", 123456)
      ).rejects.toBeDefined();
    });
  });

  describe("refreshTokenService", () => {
    it("should generate new access token", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(null, { id: "user1" })
      );

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.createAccessToken as jest.Mock).mockReturnValue("access");

      const res = await authService.refreshTokenService("token");

      expect(res.accesstoken).toBe("access");
      expect(res.user).toEqual(mockUser);
    });

    it("should reject invalid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(new Error("invalid"), null)
      );

      await expect(
        authService.refreshTokenService("bad")
      ).rejects.toBeDefined();
    });

    it("should reject if user not found", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(null, { id: "user1" })
      );

      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshTokenService("token")).rejects.toThrow();
    });
  });

  describe("forgotPasswordService", () => {
    it("should throw if email not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.forgotPasswordService("x@mail.com")
      ).rejects.toThrow("Email does not exist.");
    });

    it("should send email and return token", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.createAccessToken as jest.Mock).mockReturnValue("token");

      const res = await authService.forgotPasswordService("x@mail.com");

      expect(res).toBe("token");
    });
  });

  describe("validateConfirmForgotPasswordService", () => {
    it("should resolve valid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) => cb(null));

      const res =
        await authService.validateConfirmForgotPasswordService("token");

      expect(res).toBe(true);
    });

    it("should reject invalid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(new Error("invalid"))
      );

      await expect(
        authService.validateConfirmForgotPasswordService("bad")
      ).rejects.toBeDefined();
    });
  });

  describe("confirmForgotPasswordService", () => {
    it("should reject if password mismatch", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(null, { id: "user1" })
      );

      await expect(
        authService.confirmForgotPasswordService("token", "a", "b")
      ).rejects.toThrow("Password and confirm password not match.");
    });

    it("should update password successfully", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(null, { id: "user1" })
      );

      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const res = await authService.confirmForgotPasswordService(
        "token",
        "password",
        "password"
      );

      expect(res).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });

    it("should reject invalid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation((_, __, cb) =>
        cb(new Error("invalid"), null)
      );

      await expect(
        authService.confirmForgotPasswordService("bad", "password", "password")
      ).rejects.toBeDefined();
    });
  });
});
