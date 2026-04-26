import { Response, NextFunction } from "express";
import { slidingWindow } from "@arcjet/node";

import aj from "../config/arcjet";
import logger from "../config/logger";
import { IReqAuth } from "../types";

const securityMiddleware = async (
  req: IReqAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const role = req.user?.role || "guest";

    let limit;

    switch (role) {
      case "admin":
        limit = 20;
        break;
      case "user":
        limit = 10;
        break;
      case "guest":
        limit = 5;
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: limit,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn("Bot request blocked", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
      });

      res.status(403).json({
        error: "Forbidden",
        message: "Automated requests are not allowed",
      });
      return;
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn("Shield Blocked request", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        error: "Forbidden",
        message: "Request blocked by security policy",
      });
      return;
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
      });

      res
        .status(403)
        .json({ error: "Forbidden", message: "Too many requests" });
      return;
    }

    next();
  } catch (e) {
    logger.error("Arcjet middleware error:", e);

    res.status(500).json({
      errro: "Internal server error",
      message: "Something went wrong with security middleware",
    });
  }
};
export default securityMiddleware;
