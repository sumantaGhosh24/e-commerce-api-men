import { Request, Response } from "express";

import { createAccessToken } from "../utils/jwt";
import { formatValidationError } from "../utils/format";
import {
  confirmForgotPasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from "../validations/auth.validation";
import {
  confirmForgotPasswordService,
  forgotPasswordService,
  loginService,
  loginVerifyService,
  refreshTokenService,
  registerService,
  registerVerifyService,
  sendLoginOtpEmailService,
  sendRegisterVerificationEmailService,
  validateConfirmForgotPasswordService,
} from "../services/auth.service";
import logger from "../config/logger";

export const register = async (req: Request, res: Response) => {
  try {
    logger.info("Started registering user");

    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { email, mobileNumber, password } = validationResult.data;

    const newUser = await registerService({ email, mobileNumber, password });

    await sendRegisterVerificationEmailService(newUser);

    logger.info(`User register request successful: ${newUser.email}`);

    res.json({
      message:
        "A verification email has been sent, click the email link to activate your account.",
    });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const registerVerify = async (req: Request, res: Response) => {
  try {
    logger.info("Started verifying register");

    const token = req.query.token;
    if (!token) {
      res.status(400).json({
        message: "Something wrong with your link, click your link again.",
      });
      return;
    }

    const data = await registerVerifyService(token as string);

    res.cookie("refreshtoken", data.refreshtoken, {
      httpOnly: true,
      path: "/api/v1/refresh_token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`Register verification successful: ${data.user._doc.email}`);

    res.json({ accesstoken: data.accesstoken, ...data.user._doc });
    return;
  } catch (error: unknown) {
    logger.error("Error verify register", error);

    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    logger.info("Started login user");

    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { email, password } = validationResult.data;

    const user = await loginService(email, password);

    const randomNumber = Math.floor(100000 + Math.random() * 999999);

    await sendLoginOtpEmailService(user, randomNumber);

    const check = createAccessToken({ num: randomNumber, id: user._id });
    res.cookie("check", check, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    });

    logger.info(`User login request successful: ${user.email}`);

    res.json({
      message: "A otp send to your email, enter the otp to login",
      verify: true,
    });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const loginVerify = async (req: Request, res: Response) => {
  try {
    logger.info("Started verifying login");

    const check = req.cookies.check;
    if (!check) {
      res.status(400).json({ message: "First login to access this page." });
      return;
    }

    if (!req.body.otp) {
      res.status(400).json({ message: "Please enter the otp." });
      return;
    }

    const data = await loginVerifyService(check, req.body.otp);

    res.cookie("refreshtoken", data.refreshtoken, {
      httpOnly: true,
      path: "/api/v1/refresh_token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`Login verification successful: ${data.user._doc.email}`);

    res.json({ accesstoken: data.accesstoken, ...data.user._doc });
    return;
  } catch (error: unknown) {
    logger.error("Error login verify", error);

    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const refresh_token = async (req: Request, res: Response) => {
  try {
    logger.info("Started refreshing token");

    const rf_token = req.cookies.refreshtoken;
    if (!rf_token) {
      res.status(400).json({ message: "Please login or register first." });
      return;
    }

    const data = await refreshTokenService(rf_token);

    logger.info(`Refresh token generated successful: ${data.user._doc.email}`);

    res.json({ accesstoken: data.accesstoken, ...data.user._doc });
  } catch (error: unknown) {
    logger.error("Error refresh token", error);

    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    logger.info("Started logging out");

    res.clearCookie("refreshtoken", { path: "/api/v1/refresh_token" });

    logger.info("User logged out");

    res.json({ message: "Logged Out." });
  } catch (error: unknown) {
    logger.error("Error logout", error);

    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    logger.info("Started forgot password");

    const validationResult = forgotPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { email } = validationResult.data;

    await forgotPasswordService(email);

    logger.info(`Forgot password sent to: ${email}`);

    res.json({
      message:
        "A forgot password link send to your email, click the email link to forgot your password.",
    });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const validateConfirmForgotPassword = async (
  req: Request,
  res: Response
) => {
  try {
    logger.info("Started validating forgot password");

    const token = req.query.token as string;
    if (!token) {
      res
        .status(400)
        .json({ message: "Click your email link to forgot your password." });
      return;
    }

    await validateConfirmForgotPasswordService(token);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    });

    logger.info("Validated forgot password successful");

    res.status(200).json({ message: "Now set your new password." });
    return;
  } catch (error: unknown) {
    logger.error("Error validate confirm forgot password", error);

    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const confirmForgotPassword = async (req: Request, res: Response) => {
  try {
    logger.info("Started confirming forgot password");

    const validationResult = confirmForgotPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { password, cf_password } = validationResult.data;

    const token = req.cookies.token;
    if (!token) {
      res.status(400).json({
        message: "Something wrong with your link, click your email link again.",
      });
      return;
    }

    await confirmForgotPasswordService(token, password, cf_password);

    logger.info("Forgot password confirmed successful");

    res.clearCookie("token");

    res
      .status(200)
      .json({ message: "Your password has been updated, now login." });
    return;
  } catch (error: unknown) {
    logger.error("Error confirm forgot password", error);

    res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
