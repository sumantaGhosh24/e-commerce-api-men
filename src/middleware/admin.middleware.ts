import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import User from "../models/user.model";
import { IReqAuth } from "../types";
import logger from "../config/logger";

const authAdmin = (req: IReqAuth, res: Response, next: NextFunction) => {
  try {
    const authHeader =
      (req.headers.authorization as string) ||
      (req.headers.Authorization as string);
    if (!authHeader || !authHeader!.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (err: unknown, decoded: any) => {
        if (err) {
          res.clearCookie("jwt", { httpOnly: true });
          res.status(403).json({ message: "Forbidden" });
          return;
        }
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return;
        req.user = user;
        if (user.role === "admin") {
          logger.info(`Admin authenticated: ${user.email}`);

          next();
        } else {
          res
            .status(401)
            .json({ message: "Only admin can access this routes." });
        }
      }
    );
  } catch (error: unknown) {
    logger.error("Error to authenticate admin", error);

    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export default authAdmin;
