import request from "supertest";

import app from "../../src/app";
import * as userService from "../../src/services/user.service";

jest.mock("@arcjet/node", () => ({
  slidingWindow: jest.fn(),
}));
jest.mock("../../src/config/arcjet", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../src/middleware/security.middleware", () =>
  jest.fn((req, _res, next) => next())
);
jest.mock("../../src/middleware/auth.middleware", () =>
  jest.fn((req, _res, next) => {
    req.user = { _id: "user123", role: "user" };
    next();
  })
);
jest.mock("../../src/middleware/admin.middleware", () =>
  jest.fn((req, _res, next) => {
    req.user = { _id: "admin123", role: "admin" };
    next();
  })
);
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../src/services/user.service");

describe("User Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PUT /api/user-image", () => {
    it("should update user image", async () => {
      (userService.updateUserImageService as jest.Mock).mockResolvedValue(
        "Image updated"
      );

      const res = await request(app)
        .put("/api/user-image")
        .send({
          image: { url: "img", public_id: "1" },
        })
        .expect(200);

      expect(res.body).toHaveProperty("message");
      expect(userService.updateUserImageService).toHaveBeenCalled();
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .put("/api/user-image")
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/user-data", () => {
    it("should update user data", async () => {
      (userService.updateUserDataService as jest.Mock).mockResolvedValue(
        "User data updated"
      );

      const res = await request(app)
        .put("/api/user-data")
        .send({
          firstName: "John",
          lastName: "Doe",
          username: "john",
          dob: "2000-01-01",
          gender: "male",
        })
        .expect(200);

      expect(res.body).toHaveProperty("message");
      expect(userService.updateUserDataService).toHaveBeenCalled();
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app).put("/api/user-data").send({}).expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/user-address", () => {
    it("should update address", async () => {
      (userService.updateUserAddressService as jest.Mock).mockResolvedValue(
        "Address updated"
      );

      const res = await request(app)
        .put("/api/user-address")
        .send({
          city: "Kolkata",
          state: "WB",
          country: "India",
          zip: "700001",
          addressline: "Street",
        })
        .expect(200);

      expect(res.body).toHaveProperty("message");
      expect(userService.updateUserAddressService).toHaveBeenCalled();
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .put("/api/user-address")
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/reset-password", () => {
    it("should reset password", async () => {
      (userService.resetPasswordService as jest.Mock).mockResolvedValue(
        "Password reset"
      );

      const res = await request(app)
        .post("/api/reset-password")
        .send({
          previousPassword: "oldpass",
          newPassword: "newpass",
          cf_newPassword: "newpass",
        })
        .expect(200);

      expect(res.body).toHaveProperty("message");
      expect(userService.resetPasswordService).toHaveBeenCalled();
    });

    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .post("/api/reset-password")
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/user/:id", () => {
    it("should delete user", async () => {
      (userService.deleteUserService as jest.Mock).mockResolvedValue(
        "User deleted"
      );

      const res = await request(app).delete("/api/user/123").expect(200);

      expect(res.body).toHaveProperty("message");
      expect(userService.deleteUserService).toHaveBeenCalledWith("123");
    });
  });

  describe("GET /api/users", () => {
    it("should get all users", async () => {
      (userService.getUsersService as jest.Mock).mockResolvedValue({
        users: [],
        count: 0,
      });

      const res = await request(app).get("/api/users").expect(200);

      expect(res.body).toEqual({ users: [], count: 0 });
      expect(userService.getUsersService).toHaveBeenCalled();
    });
  });
});
