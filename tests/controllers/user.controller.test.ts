import { Request, Response } from "express";

import * as userController from "../../src/controllers/user.controller";
import * as userService from "../../src/services/user.service";
import * as validations from "../../src/validations/user.validation";
import * as formatUtils from "../../src/utils/format";

jest.mock("../../src/services/user.service");
jest.mock("../../src/validations/user.validation");
jest.mock("../../src/utils/format");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

interface MockAuthRequest extends Partial<Request> {
  user?: { _id: string };
}

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("User Controller", () => {
  afterEach(() => jest.clearAllMocks());

  describe("userImage", () => {
    it("should return 400 if validation fails", async () => {
      (validations.userImageSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      (formatUtils.formatValidationError as jest.Mock).mockReturnValue(
        "validation error"
      );

      const req = { body: {}, user: { _id: "user1" } } as MockAuthRequest;
      const res = mockResponse();

      await userController.userImage(req as never, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update user image successfully", async () => {
      (validations.userImageSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          image: { url: "img", public_id: "1" },
        },
      });

      const req = { body: {}, user: { _id: "user1" } } as MockAuthRequest;
      const res = mockResponse();

      await userController.userImage(req as never, res);

      expect(userService.updateUserImageService).toHaveBeenCalledWith("user1", {
        url: "img",
        public_id: "1",
      });
      expect(res.json).toHaveBeenCalledWith({
        message: "User image updated.",
      });
    });

    it("should return 500 on error", async () => {
      (validations.userImageSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { image: { url: "img", public_id: "1" } },
      });

      (userService.updateUserImageService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const req = { body: {}, user: { _id: "user1" } } as MockAuthRequest;
      const res = mockResponse();

      await userController.userImage(req as never, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("userData", () => {
    it("should return 400 if validation fails", async () => {
      (validations.userDataSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {},
      });

      const req = { body: {}, user: { _id: "user1" } } as MockAuthRequest;
      const res = mockResponse();

      await userController.userData(req as never, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update user data successfully", async () => {
      const data = {
        firstName: "John",
        lastName: "Doe",
        username: "john",
        dob: "2000-01-01",
        gender: "male",
      };

      (validations.userDataSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data,
      });

      const req = { body: {}, user: { _id: "user1" } } as MockAuthRequest;
      const res = mockResponse();

      await userController.userData(req as never, res);

      expect(userService.updateUserDataService).toHaveBeenCalledWith(
        "user1",
        data
      );
    });

    it("should return 500 on error", async () => {
      (validations.userDataSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          firstName: "a",
          lastName: "b",
          username: "c",
          dob: "2000-01-01",
          gender: "male",
        },
      });

      (userService.updateUserDataService as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const req = { body: {}, user: { _id: "user1" } } as MockAuthRequest;
      const res = mockResponse();

      await userController.userData(req as never, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("userAddress", () => {
    it("should transform to lowercase", async () => {
      const data = {
        city: "KOLKATA",
        state: "WB",
        country: "INDIA",
        zip: "700001",
        addressline: "MAIN ROAD",
      };

      (validations.userAddressSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data,
      });

      const req = { body: {}, user: { _id: "user1" } } as MockAuthRequest;
      const res = mockResponse();

      await userController.userAddress(req as never, res);

      expect(userService.updateUserAddressService).toHaveBeenCalledWith(
        "user1",
        {
          city: "kolkata",
          state: "wb",
          country: "india",
          zip: "700001",
          addressline: "main road",
        }
      );
    });
  });

  describe("resetPassword", () => {
    it("should reset password", async () => {
      (validations.resetPasswordSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          previousPassword: "old",
          newPassword: "new",
        },
      });

      const req = { body: {}, user: { _id: "user1" } } as MockAuthRequest;
      const res = mockResponse();

      await userController.resetPassword(req as never, res);

      expect(userService.resetPasswordService).toHaveBeenCalledWith(
        "user1",
        "old",
        "new"
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete user", async () => {
      (validations.userIdSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "1" },
      });

      const req = { params: { id: "1" } } as unknown as Request;
      const res = mockResponse();

      await userController.deleteUser(req, res);

      expect(userService.deleteUserService).toHaveBeenCalledWith("1");
    });
  });

  describe("getUsers", () => {
    it("should return users", async () => {
      const mockData = { users: [], count: 0 };

      (userService.getUsersService as jest.Mock).mockResolvedValue(mockData);

      const req = { query: {} } as unknown as Request;
      const res = mockResponse();

      await userController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
