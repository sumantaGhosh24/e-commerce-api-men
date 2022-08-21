import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import {APIFeatures} from "../lib/features.js";
import {User, Order} from "../models/index.js";

const userCtrl = {
  // register user
  register: async (req, res) => {
    try {
      const {email, mobileNumber, password, cf_password} = req.body;
      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please Fill ${key} Field.`);
        }
      }
      if (errors.length > 0) {
        return res.status(400).json({msg: errors});
      }
      if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
        return res.status(400).json({msg: "Please Enter a Valid Email."});
      }
      if (!mobileNumber.match(/^\d{10}$/)) {
        return res
          .status(400)
          .json({msg: "Please Enter a Valid Mobile Number."});
      }
      const userEmail = await User.findOne({email});
      if (userEmail) {
        return res.status(400).json({msg: "This Email Already Register."});
      }
      const userMobileNumber = await User.findOne({mobileNumber});
      if (userMobileNumber) {
        return res
          .status(400)
          .json({msg: "This Mobile Number Already Register."});
      }
      if (password.length < 6) {
        return res
          .status(400)
          .json({msg: "Password Length must be 6 Character Long."});
      }
      if (password !== cf_password) {
        return res
          .status(400)
          .json({msg: "Password and Confirm Password not Match."});
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
        from: "E-Commerce Clone || Register Verification",
        to: to,
        subject: "Email Verification Link - E-Commerce Clone",
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
<title>E-Commerce Clone || Register Verification</title>
</head>
<body>
<div class="container-fluid bg-primary text-center"><h1 class="text-white p-5">E-Commerce Clone || Register Verification</h1></div>
<div class="container my-5"><h2 class="fw-bold">Hello,</h2><p class="text-muted">Click below button to activate your account.</p></div>
<div class="container my-5"><p class="text-muted">If you not ask for verify your account, you can ignore this email.</p><h2 class="fw-bold">Thanks for Register our website.</h2></div>
<div class="container mb-5"><div class="position-relative"><a class="position-absolute top-50 start-50 p-3 btn btn-primary" href="${process.env.BASE_URL}/register-verify?token=${token}">Activate Account</a></div></div>
</body>
</html>`,
      });
      return res.json({
        msg: "A verification email has been sent, click the email link to activate your account.",
      });
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // verify register
  registerVerify: async (req, res) => {
    try {
      const token = req.query.token;
      if (!token) {
        return res.status(400).json({
          msg: "Something wrong with your link, click your link again.",
        });
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if (err)
          return res.status(400).json({
            msg: "Something wrong with your link, click your link again.",
          });
        const us = await User.findById(user.id);
        if (!us)
          return res.status(400).json({
            msg: "Something wrong with your link, click your link again.",
          });
        await User.findByIdAndUpdate(us._id, {status: "active"});
        const accesstoken = createAccessToken({id: us._id});
        const refreshtoken = createRefreshToken({id: us._id});
        res.cookie("refreshtoken", refreshtoken, {
          httpOnly: true,
          path: "/api/refresh_token",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({accesstoken});
      });
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // get refresh token
  refresh_token: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token)
        return res.status(400).json({msg: "Please Login or Register First."});
      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err)
          return res.status(400).json({msg: "Please Login or Register First."});
        const accesstoken = createAccessToken({id: user.id});
        res.json({accesstoken});
      });
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // add user data
  userData: async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        username,
        image,
        dob,
        gender,
        twoStepVerification,
      } = req.body;
      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        return res.status(400).json({msg: errors});
      }
      const matchUsername = await User.findOne({username});
      if (matchUsername) {
        return res
          .status(400)
          .json({msg: "This username already register, try another one."});
      }
      const user = await User.findByIdAndUpdate(req.user.id, {
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
        username: username.toLowerCase(),
        image,
        dob,
        gender: gender.toLowerCase(),
        twoStepVerification,
      });
      if (!user) {
        return res.status(400).json({msg: "User does not exists."});
      }
      return res.json(user);
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // add user address
  userAddress: async (req, res) => {
    try {
      const {city, state, country, zip, addressline1, addressline2} = req.body;
      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        return res.status(400).json({msg: errors});
      }
      const user = await User.findByIdAndUpdate(req.user.id, {
        city: city.toLowerCase(),
        state: state.toLowerCase(),
        country: country.toLowerCase(),
        zip,
        addressline1: addressline1.toLowerCase(),
        addressline2: addressline2.toLowerCase(),
      });
      if (!user) {
        return res.status(400).json({msg: "User does not exists."});
      }
      return res.json(user);
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // login user
  login: async (req, res) => {
    try {
      const {email, password} = req.body;
      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        return res.status(400).json({msg: errors});
      }
      const user = await User.findOne({email});
      if (!user) return res.status(400).json({msg: "User doest not Exists."});
      if (user.status == "inactive") {
        return res.status(400).json({
          msg: "This email not verified, when you register a verification email sent to your email, click email link to verify your email.",
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({msg: "Invalid Login Credentials."});

      if (user.twoStepVerification == 0) {
        const accesstoken = createAccessToken({id: user._id});
        const refreshtoken = createRefreshToken({id: user._id});
        res.cookie("refreshtoken", refreshtoken, {
          httpsOnly: true,
          path: "/api/refresh_token",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({accesstoken});
      }

      const randomNumber = Math.floor(100000 + Math.random() * 999999);
      const check = createAccessToken({num: randomNumber, id: user._id});
      res.cookie("check", check, {
        httpsOnly: true,
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
        from: "E-Commerce Clone || Register Verification",
        to: user.email,
        subject: "Email Verification Link - E-Commerce Clone",
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
<title>E-Commerce Clone || Login Two Step Verification</title>
</head>
<body>
<div class="container-fluid bg-primary text-center"><h1 class="text-white p-5">E-Commerce Clone || Login Two Step Verification</h1></div>
<div class="container my-5"><h2 class="fw-bold">Hello,</h2><p class="text-muted">The bottom number is your otp, enter the number to complete your login process.</p></div>
<div class="container my-5"><p class="text-muted">If you not ask for login in your account, you can ignore this email.</p><h2 class="fw-bold">Thanks for Register our website.</h2></div>
<div class="container mb-5"><div class="position-relative"><code style="color: white; background: gray; padding: 10px 16px; font-weight: bold; font-size: 24px;">${randomNumber}</code></div></div>
</body>
</html>`,
      });
      return res.json({
        msg: "A otp send to your email, enter the otp to login",
        verify: true,
      });
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // login verify
  loginVerify: async (req, res) => {
    try {
      const check = req.cookies.check;
      if (!check) {
        return res.status(400).json({msg: "First login to access this page."});
      }
      jwt.verify(check, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if (err) {
          res.clearCookie("check");
          return res.status(400).json({msg: err.message});
        }
        if (user.num == req.body.code) {
          res.clearCookie("check");
          const accesstoken = createAccessToken({id: user._id});
          const refreshtoken = createRefreshToken({id: user._id});
          res.cookie("refreshtoken", refreshtoken, {
            httpsOnly: true,
            path: "/api/refresh_token",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });
          return res.json({accesstoken});
        }
      });
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // logout user
  logout: (req, res) => {
    try {
      res.clearCookie("refreshtoken", {path: "/api/refresh_token"});
      res.json({msg: "Logged Out."});
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // update user data
  userDataUpdate: async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        username,
        image,
        dob,
        gender,
        twoStepVerification,
      } = req.body;
      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        return res.status(400).json({msg: errors});
      }
      const getUsername = await User.findById(req.params.id);
      if (getUsername != username) {
        const matchUsername = await User.findOne({username});
        if (matchUsername) {
          return res
            .status(400)
            .json({msg: "This username already register, try another one."});
        }
      }
      const user = await User.findByIdAndUpdate(req.params.id, {
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
        username: username.toLowerCase(),
        image,
        dob,
        gender: gender.toLowerCase(),
        twoStepVerification,
      });
      if (!user) {
        return res.status(400).json({msg: "User does not exists."});
      }
      return res.status(user);
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // update user address
  userAddressUpdate: async (req, res) => {
    try {
      const {city, state, country, zip, addressline1, addressline2} = req.body;
      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        return res.status(400).json({msg: errors});
      }
      const user = await User.findByIdAndUpdate(req.params.id, {
        city: city.toLowerCase(),
        state: state.toLowerCase(),
        country: country.toLowerCase(),
        zip,
        addressline1: addressline1.toLowerCase(),
        addressline2: addressline2.toLowerCase(),
      });
      if (!user) {
        return res.status(400).json({msg: "User does not exists."});
      }
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // delete user
  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(400).json({msg: "User does not exists."});
      res.json({msg: "Product Deleted."});
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // reset password
  resetPassword: async (req, res) => {
    try {
      const {previousPassword, newPassword, cf_newPassword} = req.body;
      const errors = [];
      for (const key in req.body) {
        if (!req.body[key]) {
          errors.push(`Please fill ${key} field.`);
        }
      }
      if (errors.length > 0) {
        return res.status(400).json({msg: errors});
      }
      const user = await User.findById(req.user.id);
      const isMatch = await bcrypt.compare(previousPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({msg: "Invalid login credentials."});
      }
      if (newPassword !== cf_newPassword) {
        return res
          .status(400)
          .json({msg: "Password and Confirm Password not match."});
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateUser = await User.findByIdAndUpdate(req.user.id, {
        password: hashedPassword,
      });
      if (!updateUser) {
        return res.status(400).json({msg: "User does not exists."});
      }
      return res.json(updateUser);
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // get cart
  getCart: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(400).json({msg: "User does not Exists."});
      res.json(user.cart);
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // add to cart
  addCart: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(400).json({msg: "User doest not Exists."});
      await User.findOneAndUpdate(
        {_id: req.user.id},
        {
          cart: req.body.cart,
        }
      );
      return res.json({msg: "Added to cart."});
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // forgot password
  forgotPassword: async (req, res) => {
    try {
      const {email} = req.body;
      const user = await User.findOne(email);
      if (!user) {
        return res.status(400).json({msg: "Email does not exist."});
      }
      const check = createAccessToken({id: user.id});
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });
      await transporter.sendMail({
        from: "E-Commerce Clone || Register Verification",
        to: user.email,
        subject: "Email Verification Link - E-Commerce Clone",
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
<title>E-Commerce Clone || Forgot Password</title>
</head>
<body>
<div class="container-fluid bg-primary text-center"><h1 class="text-white p-5">E-Commerce Clone || Forgot Password</h1></div>
<div class="container my-5"><h2 class="fw-bold">Hello,</h2><p class="text-muted">Click below button to forgot your password.</p></div>
<div class="container my-5"><p class="text-muted">If you not ask for forgot password in your email, you can ignore this email.</p><h2 class="fw-bold">Thanks for Register our website.</h2></div>
<div class="container mb-5"><div class="position-relative"><a class="position-absolute top-50 start-50 p-3 btn btn-primary" href="${process.env.BASE_URL}/register-verify?token=${check}">Activate Account</a></div></div>
</body>
</html>`,
      });
      return res.json({
        msg: "A forgot password link send to your email, click the email link to forgot your password.",
      });
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // validate confirm forgot password
  validateConfirmForgotPassword: async (req, res) => {
    try {
      const token = req.query.token;
      if (!token) {
        return res
          .status(400)
          .json({msg: "Click your email link to forgot your password."});
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if (err) {
          return res.status(400).json({msg: err.message});
        }
        res.cookie("token", token, {httpOnly: true, maxAge: 10 * 60 * 1000});
        return res.status(200).json({msg: "Now set your new password."});
      });
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // confirm forgot password
  confirmForgotPassword: async (req, res) => {
    try {
      const {password, cf_password} = req.body;
      const token = req.cookie.token;
      if (!token) {
        return res.status(400).json({
          msg: "Something wrong with your link, click your email link again.",
        });
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if (err) {
          res.clearCookie("token");
          return res.status(400).json({msg: err.message});
        }
        if (password !== cf_password) {
          return res
            .status(400)
            .json({msg: "Password and Confirm Password not match."});
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(user.id, {password: passwordHash});
        return res
          .status(200)
          .json({msg: "Your password has been updated, now login."});
      });
    } catch (error) {
      return res.status(400).json({msg: error});
    }
  },
  // get all users
  getUsers: async (req, res) => {
    try {
      const features = new APIFeatures(
        User.find().populate("cart.product"),
        req.query
      )
        .paginating()
        .sorting()
        .searching()
        .filtering();
      const result = await Promise.allSettled([
        features.query,
        User.countDocuments(),
      ]);
      const users = result[0].status === "fulfilled" ? result[0].value : [];
      const count = result[1].status === "fulfilled" ? result[1].value : 0;
      res.json({users, count});
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
  // get user
  getUser: async (req, res) => {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("cart.product");
    if (!user) return res.status(400).json({msg: "User does not Exists."});
    const order = await Order.find({user: req.params.id});
    res.json({user, order});
  },
};

// create accesstoken
const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "60m"});
};

// create refresh token
const createRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"});
};

export default userCtrl;
