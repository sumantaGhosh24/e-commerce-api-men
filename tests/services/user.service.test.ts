import bcrypt from "bcryptjs";

import User, { IUser } from "../../src/models/user.model";
import * as userService from "../../src/services/user.service";
import redisClient from "../../src/config/redis";
import { APIFeatures } from "../../src/utils/pagination";

jest.mock("bcryptjs");
jest.mock("../../src/models/user.model");
jest.mock("../../src/config/redis");
jest.mock("../../src/utils/pagination");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockedRedis = redisClient as jest.Mocked<typeof redisClient>;
const MockedAPIFeatures = APIFeatures as unknown as jest.Mock;

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
    city: "city",
    state: "state",
    country: "country",
    zip: "123456",
    addressline: "address",
    status: "active",
    role: "user",
    _doc: {},
    ...overrides,
  } as IUser;
};

const mockFeatures = <T>(data: T) => ({
  query: Promise.resolve(data),
  paginating: jest.fn().mockReturnThis(),
  sorting: jest.fn().mockReturnThis(),
  searching: jest.fn().mockReturnThis(),
  filtering: jest.fn().mockReturnThis(),
});

describe("User Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("updateUserImageService", () => {
    it("should update user image successfully", async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(createMockUser());

      const res = await userService.updateUserImageService("1", {
        url: "img",
        public_id: "pid",
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("1", {
        image: { url: "img", public_id: "pid" },
      });

      expect(res).toBeDefined();
    });

    it("should throw if user not found", async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.updateUserImageService("1", {
          url: "img",
          public_id: "pid",
        })
      ).rejects.toThrow("User does not exists.");
    });
  });

  describe("updateUserDataService", () => {
    it("should update user data successfully", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(createMockUser());

      const res = await userService.updateUserDataService("1", {
        firstName: "John",
        lastName: "Doe",
        username: "john",
        dob: "2000-01-01",
        gender: "male",
      });

      expect(User.findOne).toHaveBeenCalledWith({ username: "john" });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("1", {
        firstName: "john",
        lastName: "doe",
        username: "john",
        dob: "2000-01-01",
        gender: "male",
      });

      expect(res).toBeDefined();
    });

    it("should throw if username already exists", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(createMockUser());

      await expect(
        userService.updateUserDataService("1", {
          firstName: "John",
          lastName: "Doe",
          username: "john",
          dob: "2000-01-01",
          gender: "male",
        })
      ).rejects.toThrow("already register");
    });

    it("should throw if user not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.updateUserDataService("1", {
          firstName: "John",
          lastName: "Doe",
          username: "john",
          dob: "2000-01-01",
          gender: "male",
        })
      ).rejects.toThrow("User does not exists.");
    });
  });

  describe("updateUserAddressService", () => {
    it("should update address successfully", async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(createMockUser());

      const res = await userService.updateUserAddressService("1", {
        city: "Kolkata",
        state: "WB",
        country: "India",
        zip: "700001",
        addressline: "Street",
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalled();

      expect(res).toBeDefined();
    });

    it("should throw if user not found", async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.updateUserAddressService("1", {
          city: "Kolkata",
          state: "WB",
          country: "India",
          zip: "700001",
          addressline: "Street",
        })
      ).rejects.toThrow("User does not exists.");
    });
  });

  describe("resetPasswordService", () => {
    it("should reset password successfully", async () => {
      (User.findById as jest.Mock).mockResolvedValue(createMockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("newhashed");

      const res = await userService.resetPasswordService("1", "old", "new");

      expect(bcrypt.compare).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith("new", 10);
      expect(User.findByIdAndUpdate).toHaveBeenCalled();

      expect(res).toBeDefined();
    });

    it("should throw if user not found", async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.resetPasswordService("1", "old", "new")
      ).rejects.toThrow("User does not exists.");
    });

    it("should throw if password mismatch", async () => {
      (User.findById as jest.Mock).mockResolvedValue(createMockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        userService.resetPasswordService("1", "old", "new")
      ).rejects.toThrow("Invalid login credentials.");
    });
  });

  describe("deleteUserService", () => {
    it("should delete user successfully", async () => {
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(createMockUser());

      const res = await userService.deleteUserService("1");

      expect(User.findByIdAndDelete).toHaveBeenCalledWith("1");
      expect(res).toBeDefined();
    });

    it("should throw if user not found", async () => {
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(userService.deleteUserService("1")).rejects.toThrow(
        "User does not exists."
      );
    });
  });

  describe("getUsersService", () => {
    it("should return cached data", async () => {
      mockedRedis.get.mockResolvedValue(
        JSON.stringify({ users: [], count: 0 })
      );

      const res = await userService.getUsersService({});

      expect(res).toEqual({ users: [], count: 0 });
      expect(mockedRedis.get).toHaveBeenCalled();
    });

    it("should fetch from DB and cache", async () => {
      mockedRedis.get.mockResolvedValue(null);

      MockedAPIFeatures.mockImplementation(() => mockFeatures([{ _id: "1" }]));

      mockedRedis.setEx.mockResolvedValue("OK");

      const res = await userService.getUsersService({});

      expect(res.users).toEqual([{ _id: "1" }]);
      expect(res.count).toBe(1);
      expect(mockedRedis.setEx).toHaveBeenCalled();
    });
  });
});
