import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import dotenv from "dotenv";

import User, { IUser } from "../models/user.model";
import { createAccessToken, createRefreshToken } from "../utils/jwt";
import logger from "../config/logger";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const from = process.env.EMAIL as string;

export const registerService = async (data: {
  email: string;
  mobileNumber: string;
  password: string;
}) => {
  try {
    const { email, mobileNumber, password } = data;

    const userEmail = await User.findOne({ email });
    if (userEmail) {
      throw new Error("This email address already registered");
    }

    const userMobileNumber = await User.findOne({ mobileNumber });
    if (userMobileNumber) {
      throw new Error("This mobile number already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      mobileNumber,
      password: passwordHash,
    });
    await newUser.save();

    return newUser;
  } catch (error) {
    logger.error("Error creating the user", error);

    throw error;
  }
};

export const sendRegisterVerificationEmailService = async (user: IUser) => {
  try {
    const token = createAccessToken({ id: user._id });
    const to = user.email;

    const { error } = await resend.emails.send({
      from,
      to,
      subject: "Email Verification Link - E-Commerce",
      html: `<!doctype html>
  <html lang=en>
  <head>
  <meta charset=utf-8>
  <meta name=viewport content="width=device-width,initial-scale=1">
  <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      .container, .container-fluid{width:100%;padding-left:24px;padding-right:24px;margin-right:auto;margin-left:auto}
      .container{max-width:900px;}
      .bg-primary{background-color:#0d6efd;}
      .text-center{text-align:center;}
      .text-white{color:white;}
      .p-5{padding:48px;}
      .my-5{margin-top:48px;margin-bottom:48px;}
      .fw-bold{font-weight:700;}
      .text-muted{color:#6c757d;}
      .mb-5{margin-bottom:48px;}
      .position-relative{position:relative;}
      .position-absolute{position:absolute;}
      .top-50{top:50%;}
      .start-50{left:50%;}
      .p-3{padding:16px;}
      .btn{display:inline-block;font-weight:400;font-height:1.5;color:#212529;text-align:center;text-decoration:none;vertical-align:middle;cursor:pointer;user-select:none;background-color:transparent;border:1px solid transparent;padding:.375rem .75rem;font-size:16px;border-radius:.25rem;transition:all .7s ease-in-out;}
      .btn-primary{color:#fff;background-color:#0d6efd;border-color:#0a58ca;}
      .btn-primary:hover{color:#fff;background-color:#0b5ed7;border-color:#0a58ca;}
      h1{font-size:calc(1.375rem+1.5vw);}
      h2{font-size:calc(1.325rem+.9vw);}
      p{margin-top:0;margin-bottom:1rem;}
  </style>
  <title>E-Commerce || Register Verification</title>
  </head>
  <body>
  <div class="container-fluid bg-primary text-center"><h1 class="text-white p-5">E-Commerce || Register Verification</h1></div>
  <div class="container my-5"><h2 class="fw-bold">Hello,</h2><p class="text-muted">Click below button to activate your account.</p></div>
  <div class="container my-5"><p class="text-muted">If you not ask for verify your account, you can ignore this email.</p><h2 class="fw-bold">Thanks for Register our website.</h2></div>
  <div class="container mb-5"><div class="position-relative"><a class="position-absolute top-50 start-50 p-3 btn btn-primary" href="${process.env.FRONTEND_URL}/register-verify?token=${token}">Activate Account</a></div></div>
  </body>
  </html>`,
    });

    if (error) {
      throw new Error("Error sending email.");
    }

    return token;
  } catch (error) {
    logger.error("Error sending register verification email", error);

    throw error;
  }
};

type VerifyResponse = {
  accesstoken: string;
  refreshtoken: string;
  user: IUser;
};

export const registerVerifyService = async (token: string) => {
  try {
    return new Promise<VerifyResponse>((resolve, reject) => {
      jwt.verify(
        token as string,
        process.env.ACCESS_TOKEN_SECRET!,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (err: unknown, user: any) => {
          if (err) {
            reject("Something wrong with your link, click your link again.");
            return;
          }

          const us = await User.findById(user.id).select("-password");
          if (!us) {
            reject("Something wrong with your link, click your link again.");
            return;
          }

          await User.findByIdAndUpdate(us._id, { status: "active" });

          const accesstoken = createAccessToken({ id: us._id });
          const refreshtoken = createRefreshToken({ id: us._id });

          resolve({ accesstoken, refreshtoken, user: us });
        }
      );
    });
  } catch (error) {
    logger.error("Error verify register", error);

    throw error;
  }
};

export const loginService = async (email: string, password: string) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User doest not exists.");
    }

    if (user.status == "inactive") {
      throw new Error(
        "This email not verified, when you register a verification email sent to your email, click email link to verify your email."
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid Login Credentials.");
    }

    return user;
  } catch (error) {
    logger.error("Error login user", error);

    throw error;
  }
};

export const sendLoginOtpEmailService = async (user: IUser, otp: number) => {
  try {
    const { error } = await resend.emails.send({
      from,
      to: user.email,
      subject: "Email Verification Link - E-Commerce",
      html: `<!doctype html>
  <html lang=en>
  <head>
  <meta charset=utf-8>
  <meta name=viewport content="width=device-width,initial-scale=1">
  <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      .container, .container-fluid{width:100%;padding-left:24px;padding-right:24px;margin-right:auto;margin-left:auto}
      .container{max-width:900px;}
      .bg-primary{background-color:#0d6efd;}
      .text-center{text-align:center;}
      .text-white{color:white;}
      .p-5{padding:48px;}
      .my-5{margin-top:48px;margin-bottom:48px;}
      .fw-bold{font-weight:700;}
      .text-muted{color:#6c757d;}
      .mb-5{margin-bottom:48px;}
      .position-relative{position:relative;}
      .position-absolute{position:absolute;}
      .top-50{top:50%;}
      .start-50{left:50%;}
      .p-3{padding:16px;}
      .btn{display:inline-block;font-weight:400;font-height:1.5;color:#212529;text-align:center;text-decoration:none;vertical-align:middle;cursor:pointer;user-select:none;background-color:transparent;border:1px solid transparent;padding:.375rem .75rem;font-size:16px;border-radius:.25rem;transition:all .7s ease-in-out;}
      .btn-primary{color:#fff;background-color:#0d6efd;border-color:#0a58ca;}
      .btn-primary:hover{color:#fff;background-color:#0b5ed7;border-color:#0a58ca;}
      h1{font-size:calc(1.375rem+1.5vw);}
      h2{font-size:calc(1.325rem+.9vw);}
      p{margin-top:0;margin-bottom:1rem;}
  </style>
  <title>E-Commerce || Login Two Step Verification</title>
  </head>
  <body>
  <div class="container-fluid bg-primary text-center"><h1 class="text-white p-5">E-Commerce || Login Two Step Verification</h1></div>
  <div class="container my-5"><h2 class="fw-bold">Hello,</h2><p class="text-muted">The bottom number is your otp, enter the number to complete your login process.</p></div>
  <div class="container my-5"><p class="text-muted">If you not ask for login in your account, you can ignore this email.</p><h2 class="fw-bold">Thanks for Register our website.</h2></div>
  <div class="container mb-5"><div class="position-relative"><code style="color: white; background: gray; padding: 10px 16px; font-weight: bold; font-size: 24px;">${otp}</code></div></div>
  </body>
  </html>`,
    });

    if (error) {
      throw new Error("Error sending email.");
    }
  } catch (error) {
    logger.error("Error sending login verification email", error);

    throw error;
  }
};

export const loginVerifyService = async (token: string, otp: number) => {
  try {
    return new Promise<VerifyResponse>((resolve, reject) => {
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (err: unknown, user: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (user.num == otp) {
            const us = await User.findById(user.id);
            if (!us) {
              reject(
                new Error(
                  "Something wrong with your link, click your link again."
                )
              );
              return;
            }

            const accesstoken = createAccessToken({ id: us._id });
            const refreshtoken = createRefreshToken({ id: us._id });

            resolve({ accesstoken, refreshtoken, user: us });
          } else {
            reject(new Error("Invalid otp, please check your email again."));
          }
        }
      );
    });
  } catch (error) {
    logger.error("Error verify login", error);

    throw error;
  }
};

export const refreshTokenService = async (token: string) => {
  try {
    return new Promise<Omit<VerifyResponse, "refreshtoken">>(
      (resolve, reject) => {
        jwt.verify(
          token,
          process.env.REFRESH_TOKEN_SECRET!,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async (err: unknown, user: any) => {
            if (err) {
              reject(err);
              return;
            }
            const us = await User.findById(user?.id);
            if (!us) {
              reject(
                new Error(
                  "Something wrong with your link, click your link again."
                )
              );
              return;
            }

            const accesstoken = createAccessToken({ id: us._id });

            resolve({ accesstoken, user: us });
          }
        );
      }
    );
  } catch (error) {
    logger.error("Error to generate refresh token", error);

    throw error;
  }
};

export const forgotPasswordService = async (email: string) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Email does not exist.");
    }
    const check = createAccessToken({ id: user._id });

    const { error } = await resend.emails.send({
      from,
      to: user.email,
      subject: "Email Verification Link - E-Commerce",
      html: `<!doctype html>
  <html lang=en>
  <head>
  <meta charset=utf-8>
  <meta name=viewport content="width=device-width,initial-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    .container, .container-fluid{width:100%;padding-left:24px;padding-right:24px;margin-right:auto;margin-left:auto}
    .container{max-width:900px;}
    .bg-primary{background-color:#0d6efd;}
    .text-center{text-align:center;}
    .text-white{color:white;}
    .p-5{padding:48px;}
    .my-5{margin-top:48px;margin-bottom:48px;}
    .fw-bold{font-weight:700;}
    .text-muted{color:#6c757d;}
    .mb-5{margin-bottom:48px;}
    .position-relative{position:relative;}
    .position-absolute{position:absolute;}
    .top-50{top:50%;}
    .start-50{left:50%;}
    .p-3{padding:16px;}
    .btn{display:inline-block;font-weight:400;font-height:1.5;color:#212529;text-align:center;text-decoration:none;vertical-align:middle;cursor:pointer;user-select:none;background-color:transparent;border:1px solid transparent;padding:.375rem .75rem;font-size:16px;border-radius:.25rem;transition:all .7s ease-in-out;}
    .btn-primary{color:#fff;background-color:#0d6efd;border-color:#0a58ca;}
    .btn-primary:hover{color:#fff;background-color:#0b5ed7;border-color:#0a58ca;}
    h1{font-size:calc(1.375rem+1.5vw);}
    h2{font-size:calc(1.325rem+.9vw);}
    p{margin-top:0;margin-bottom:1rem;}
  </style>
  <title>E-Commerce || Forgot Password</title>
  </head>
  <body>
  <div class="container-fluid bg-primary text-center"><h1 class="text-white p-5">E-Commerce || Forgot Password</h1></div>
  <div class="container my-5"><h2 class="fw-bold">Hello,</h2><p class="text-muted">Click below button to forgot your password.</p></div>
  <div class="container my-5"><p class="text-muted">If you not ask for forgot password in your email, you can ignore this email.</p><h2 class="fw-bold">Thanks for Register our website.</h2></div>
  <div class="container mb-5"><div class="position-relative"><a class="position-absolute top-50 start-50 p-3 btn btn-primary" href="${process.env.FRONTEND_URL}/confirm-forgot-password?token=${check}">Forgot Password</a></div></div>
  </body>
  </html>`,
    });

    if (error) {
      throw new Error("Error sending email.");
    }

    return check;
  } catch (error) {
    logger.error("Error sending forgot password email", error);

    throw error;
  }
};

export const validateConfirmForgotPasswordService = async (token: string) => {
  try {
    return new Promise<boolean>((resolve, reject) => {
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
        async (error: unknown) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        }
      );
    });
  } catch (error) {
    logger.error("Error verify forgot password", error);

    throw error;
  }
};

export const confirmForgotPasswordService = async (
  token: string,
  password: string,
  cf_password: string
) => {
  try {
    return new Promise<boolean>((resolve, reject) => {
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (err: unknown, user: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (password !== cf_password) {
            reject(new Error("Password and confirm password not match."));
            return;
          }

          const passwordHash = await bcrypt.hash(password, 10);

          await User.findByIdAndUpdate(user.id, { password: passwordHash });

          resolve(true);
        }
      );
    });
  } catch (error) {
    logger.error("Error confirm forgot password", error);

    throw error;
  }
};
