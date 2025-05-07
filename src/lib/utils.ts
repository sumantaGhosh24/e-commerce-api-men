import jwt from "jsonwebtoken";

export const createAccessToken = (user: object) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET!, {expiresIn: "60m"});
};

export const createRefreshToken = (user: object) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET!, {expiresIn: "7d"});
};
