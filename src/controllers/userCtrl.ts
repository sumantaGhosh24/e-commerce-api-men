import {Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import User from "../models/userModel";
import {IReqAuth} from "../types";
import {createAccessToken, createRefreshToken} from "../lib/utils";
import {APIFeatures} from "../lib";

const userCtrl = {
  register: async (req: Request, res: Response) => {
    try {
      const {email, mobileNumber, password, cf_password} = req.body;

      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        res.status(400).json({message: errors});
        return;
      }

      if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
        res.status(400).json({message: "Please enter a valid email address."});
        return;
      }

      if (!mobileNumber.match(/^\d{10}$/)) {
        res.status(400).json({message: "Please enter a valid mobile number."});
        return;
      }

      const userEmail = await User.findOne({email});
      if (userEmail) {
        res
          .status(400)
          .json({message: "This email address already registered."});
        return;
      }

      const userMobileNumber = await User.findOne({mobileNumber});
      if (userMobileNumber) {
        res
          .status(400)
          .json({message: "This mobile number already registered."});
        return;
      }

      if (password.length < 6) {
        res
          .status(400)
          .json({message: "Password length must be 6 characters long."});
        return;
      }
      if (password !== cf_password) {
        res
          .status(400)
          .json({message: "Password and confirm password not match."});
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = new User({
        email,
        mobileNumber,
        password: passwordHash,
      });
      await newUser.save();

      const token = createAccessToken({id: newUser._id});
      const to = newUser.email;
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });
      await transporter.sendMail({
        from: "E-Commerce || Register Verification",
        to: to,
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

      res.json({
        message:
          "A verification email has been sent, click the email link to activate your account.",
      });
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  registerVerify: async (req: Request, res: Response) => {
    try {
      const token = req.query.token;
      if (!token) {
        res.status(400).json({
          message: "Something wrong with your link, click your link again.",
        });
        return;
      }

      jwt.verify(
        token as string,
        process.env.ACCESS_TOKEN_SECRET!,
        async (err: any, user: any) => {
          if (err) {
            res.status(400).json({
              message: "Something wrong with your link, click your link again.",
            });
            return;
          }

          const us = await User.findById(user.id).select("-password");
          if (!us) {
            res.status(400).json({
              message: "Something wrong with your link, click your link again.",
            });
            return;
          }

          await User.findByIdAndUpdate(us._id, {status: "active"});

          const accesstoken = createAccessToken({
            id: us._id,
          });
          const refreshtoken = createRefreshToken({
            id: us._id,
          });
          res.cookie("refreshtoken", refreshtoken, {
            httpOnly: true,
            path: "/api/v1/refresh_token",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          res.json({accesstoken, ...us._doc});
          return;
        }
      );
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  login: async (req: Request, res: Response) => {
    try {
      const {email, password} = req.body;

      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        res.status(400).json({message: errors});
        return;
      }

      const user = await User.findOne({email});
      if (!user) {
        res.status(400).json({message: "User doest not exists."});
        return;
      }

      if (user.status == "inactive") {
        res.status(400).json({
          message:
            "This email not verified, when you register a verification email sent to your email, click email link to verify your email.",
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({message: "Invalid Login Credentials."});
        return;
      }

      const randomNumber = Math.floor(100000 + Math.random() * 999999);
      const check = createAccessToken({num: randomNumber, id: user._id});
      res.cookie("check", check, {
        httpOnly: true,
        maxAge: 10 * 60 * 1000,
      });

      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });
      await transporter.sendMail({
        from: "E-Commerce || Login Verification",
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
    <div class="container mb-5"><div class="position-relative"><code style="color: white; background: gray; padding: 10px 16px; font-weight: bold; font-size: 24px;">${randomNumber}</code></div></div>
    </body>
    </html>`,
      });

      res.json({
        message: "A otp send to your email, enter the otp to login",
        verify: true,
      });
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  loginVerify: async (req: Request, res: Response) => {
    try {
      const check = req.cookies.check;
      if (!check) {
        res.status(400).json({message: "First login to access this page."});
        return;
      }

      if (!req.body.otp) {
        res.status(400).json({message: "Please enter the otp."});
        return;
      }

      jwt.verify(
        check,
        process.env.ACCESS_TOKEN_SECRET!,
        async (err: any, user: any) => {
          if (err) {
            res.clearCookie("check");
            res.status(400).json({message: err.message});
            return;
          }

          const us = await User.findById(user.id);
          if (!us) {
            res.status(400).json({
              message: "Something wrong with your link, click your link again.",
            });
            return;
          }

          if (user.num == req.body.otp) {
            res.clearCookie("check");
            const accesstoken = createAccessToken({
              id: us._id,
            });
            const refreshtoken = createRefreshToken({
              id: us._id,
            });
            res.cookie("refreshtoken", refreshtoken, {
              httpOnly: true,
              path: "/api/v1/refresh_token",
              maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.json({accesstoken, ...us._doc});
            return;
          } else {
            res
              .status(400)
              .json({message: "Invalid otp, please check your email again."});
            return;
          }
        }
      );
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  refresh_token: (req: Request, res: Response) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token) {
        res.status(400).json({message: "Please login or register first."});
        return;
      }

      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET!,
        async (err: any, user: any) => {
          if (err) {
            res.status(400).json({message: "Please login or register first."});
            return;
          }

          const us = await User.findById(user?.id);
          if (!us) {
            res.status(400).json({
              message: "Something wrong with your link, click your link again.",
            });
            return;
          }

          const accesstoken = createAccessToken({
            id: us._id,
          });

          res.json({accesstoken, ...us._doc});
        }
      );
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  logout: (req: Request, res: Response) => {
    try {
      res.clearCookie("refreshtoken", {path: "/api/v1/refresh_token"});

      res.json({message: "Logged Out."});
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  forgotPassword: async (req: Request, res: Response) => {
    try {
      const {email} = req.body;

      if (!email) {
        res.status(400).json({message: "Please enter your email address."});
        return;
      }

      const user = await User.findOne({email});
      if (!user) {
        res.status(400).json({message: "Email does not exist."});
        return;
      }

      const check = createAccessToken({id: user._id});
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      await transporter.sendMail({
        from: "E-Commerce || Forgot Password",
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

      res.json({
        message:
          "A forgot password link send to your email, click the email link to forgot your password.",
      });
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  validateConfirmForgotPassword: async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        res
          .status(400)
          .json({message: "Click your email link to forgot your password."});
        return;
      }

      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
        async (err: any, user: any) => {
          if (err) {
            res.status(400).json({message: err.message});
            return;
          }

          res.cookie("token", token, {httpOnly: true, maxAge: 10 * 60 * 1000});

          res.status(200).json({message: "Now set your new password."});
          return;
        }
      );
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  confirmForgotPassword: async (req: Request, res: Response) => {
    try {
      const {password, cf_password} = req.body;

      if (!password || !cf_password) {
        res
          .status(400)
          .json({message: "Password and confirm password are required."});
      }

      const token = req.cookies.token;
      if (!token) {
        res.status(400).json({
          message:
            "Something wrong with your link, click your email link again.",
        });
        return;
      }

      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
        async (err: any, user: any) => {
          if (err) {
            res.clearCookie("token");

            res.status(400).json({message: err.message});
            return;
          }

          if (password !== cf_password) {
            res
              .status(400)
              .json({message: "Password and confirm password not match."});
            return;
          }

          const passwordHash = await bcrypt.hash(password, 10);
          await User.findByIdAndUpdate(user.id, {password: passwordHash});

          res.clearCookie("token");

          res
            .status(200)
            .json({message: "Your password has been updated, now login."});
          return;
        }
      );
    } catch (error: any) {
      res.status(400).json({message: error.message});
      return;
    }
  },
  userImage: async (req: IReqAuth, res: Response) => {
    try {
      const {image} = req.body;

      if (!image) {
        res.status(400).json({message: "Image is required"});
        return;
      }

      const user = await User.findByIdAndUpdate(req?.user?._id, {
        image: image,
      });
      if (!user) {
        res.status(400).json({message: "User does not exists."});
        return;
      }

      res.json({message: "User image updated."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  userData: async (req: IReqAuth, res: Response) => {
    try {
      const {firstName, lastName, username, dob, gender} = req.body;

      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }

      if (errors.length > 0) {
        res.status(400).json({message: errors});
        return;
      }

      const matchUsername = await User.findOne({username});
      if (matchUsername) {
        res
          .status(400)
          .json({message: "This username already register, try another one."});
        return;
      }

      const user = await User.findByIdAndUpdate(req?.user?._id, {
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
        username: username.toLowerCase(),
        image: req.body.image,
        dob,
        gender: gender.toLowerCase(),
      });
      if (!user) {
        res.status(400).json({message: "User does not exists."});
        return;
      }

      res.json({message: "User data updated."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  userAddress: async (req: IReqAuth, res: Response) => {
    try {
      const {city, state, country, zip, addressline} = req.body;

      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        res.status(400).json({message: errors});
        return;
      }

      const user = await User.findByIdAndUpdate(req?.user?._id, {
        city: city.toLowerCase(),
        state: state.toLowerCase(),
        country: country.toLowerCase(),
        zip,
        addressline: addressline.toLowerCase(),
      });
      if (!user) {
        res.status(400).json({message: "User does not exists."});
        return;
      }

      res.json({message: "User address updated."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  resetPassword: async (req: IReqAuth, res: Response) => {
    try {
      const {previousPassword, newPassword, cf_newPassword} = req.body;

      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        res.status(400).json({message: errors});
        return;
      }

      const user = await User.findById(req?.user?._id);
      const isMatch = await bcrypt.compare(previousPassword, user!.password);
      if (!isMatch) {
        res.status(400).json({message: "Invalid login credentials."});
        return;
      }
      if (newPassword != cf_newPassword) {
        res
          .status(400)
          .json({message: "Password and Confirm Password not match."});
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateUser = await User.findByIdAndUpdate(req?.user?._id, {
        password: hashedPassword,
      });
      if (!updateUser) {
        res.status(400).json({message: "User does not exists."});
        return;
      }

      res.json({message: "Password reset successfully!"});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  deleteUser: async (req: Request, res: Response) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        res.status(400).json({message: "User does not exists."});
        return;
      }

      res.json({message: "User Deleted."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  getUsers: async (req: Request, res: Response) => {
    try {
      const features = new APIFeatures(User.find(), req.query)
        .paginating()
        .sorting()
        .searching()
        .filtering();
      const features2 = new APIFeatures(User.find(), req.query)
        .searching()
        .filtering();

      const result = await Promise.allSettled([
        features.query,
        features2.query,
      ]);

      const users = result[0].status === "fulfilled" ? result[0].value : [];
      const count =
        result[1].status === "fulfilled" ? result[1].value.length : 0;

      res.status(200).json({users, count});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
};

export default userCtrl;
