import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import authAdmin from "../../src/middleware/admin.middleware";
import User from "../../src/models/user.model";
import logger from "../../src/config/logger";
import { IReqAuth } from "../../src/types";

jest.mock("jsonwebtoken");
jest.mock("../../src/models/user.model");
jest.mock("../../src/config/logger");

describe("AuthAdmin Middleware", () => {
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

  it("should return 401 if no header", async () => {
    await authAdmin(req as IReqAuth, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 401 if header is invalid", async () => {
    req.headers = { authorization: "Invalid token" };

    await authAdmin(req as IReqAuth, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 403 if token is invalid", async () => {
    req.headers = { authorization: "Bearer token" };

    (jwt.verify as jest.Mock).mockImplementation((_t, _s, cb) =>
      cb(new Error("fail"), null)
    );

    await authAdmin(req as IReqAuth, res as Response, next);

    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should allow admin user", async () => {
    req.headers = { authorization: "Bearer token" };

    const adminUser = {
      _id: "1",
      email: "admin@test.com",
      role: "admin",
    };

    (jwt.verify as jest.Mock).mockImplementation((_t, _s, cb) =>
      cb(null, { id: "1" })
    );

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(adminUser),
    });

    await authAdmin(req as IReqAuth, res as Response, next);
    await new Promise(process.nextTick);

    expect(req.user).toEqual(adminUser);
    expect(logger.info).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should block non-admin user", async () => {
    req.headers = { authorization: "Bearer token" };

    const normalUser = {
      _id: "1",
      email: "user@test.com",
      role: "user",
    };

    (jwt.verify as jest.Mock).mockImplementation((_t, _s, cb) =>
      cb(null, { id: "1" })
    );

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(normalUser),
    });

    await authAdmin(req as IReqAuth, res as Response, next);
    await new Promise(process.nextTick);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Only admin can access this routes.",
    });
  });

  it("should not call next if user not found", async () => {
    req.headers = { authorization: "Bearer token" };

    (jwt.verify as jest.Mock).mockImplementation((_t, _s, cb) =>
      cb(null, { id: "1" })
    );

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await authAdmin(req as IReqAuth, res as Response, next);
    await new Promise(process.nextTick);

    expect(next).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors (catch block)", async () => {
    req.headers = { authorization: "Bearer token" };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Crash");
    });

    await authAdmin(req as IReqAuth, res as Response, next);

    expect(logger.error).toHaveBeenCalledWith(
      "Error to authenticate admin",
      expect.any(Error)
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
