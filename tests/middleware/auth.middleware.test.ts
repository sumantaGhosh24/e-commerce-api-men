import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import auth from "../../src/middleware/auth.middleware";
import User from "../../src/models/user.model";
import logger from "../../src/config/logger";
import { IReqAuth } from "../../src/types";

jest.mock("jsonwebtoken");
jest.mock("../../src/models/user.model");
jest.mock("../../src/config/logger");

describe("Auth Middleware", () => {
  let req: Partial<IReqAuth>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  it("should return 401 if no auth header", async () => {
    await auth(req as IReqAuth, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("should return 401 if header does not start with Bearer", async () => {
    req.headers = { authorization: "Invalid token" };

    await auth(req as IReqAuth, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 403 if jwt verification fails", async () => {
    req.headers = { authorization: "Bearer token" };

    (jwt.verify as jest.Mock).mockImplementation(
      (_token, _secret, callback) => {
        callback(new Error("Invalid token"), null);
      }
    );

    await auth(req as IReqAuth, res as Response, next);

    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  it("should call next if token is valid and user exists", async () => {
    req.headers = { authorization: "Bearer token" };

    const mockUser = {
      _id: "user1",
      email: "test@test.com",
    };

    (jwt.verify as jest.Mock).mockImplementation(
      (_token, _secret, callback) => {
        callback(null, { id: "user1" });
      }
    );

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await auth(req as IReqAuth, res as Response, next);

    await new Promise(process.nextTick);

    expect(req.user).toEqual(mockUser);
    expect(logger.info).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should not call next if user not found", async () => {
    req.headers = { authorization: "Bearer token" };

    (jwt.verify as jest.Mock).mockImplementation(
      (_token, _secret, callback) => {
        callback(null, { id: "user1" });
      }
    );

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await auth(req as IReqAuth, res as Response, next);
    await new Promise(process.nextTick);

    expect(next).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors (catch block)", async () => {
    req.headers = { authorization: "Bearer token" };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Crash");
    });

    await auth(req as IReqAuth, res as Response, next);

    expect(logger.error).toHaveBeenCalledWith(
      "Error to authenticate user",
      expect.any(Error)
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
