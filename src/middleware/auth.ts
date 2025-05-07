import {Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

import User from "../models/userModel";
import {IReqAuth} from "../types";

const auth = (req: IReqAuth, res: Response, next: NextFunction) => {
  try {
    const authHeader =
      (req.headers.authorization as string) ||
      (req.headers.Authorization as string);
    if (!authHeader || !authHeader!.startsWith("Bearer ")) {
      res.status(401).json({message: "Unauthorized"});
      return;
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!,
      async (err: any, decoded: any) => {
        if (err) {
          res.clearCookie("jwt", {httpOnly: true});
          res.status(403).json({message: "Forbidden"});
          return;
        }
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return;
        req.user = user;
        next();
      }
    );
  } catch (error: any) {
    res.status(500).json({message: error.message});
    return;
  }
};

export default auth;
