import express from "express";

import {userCtrl} from "../controllers/index.js";
import {auth, authAdmin, checkValidUserOrAdmin} from "../middleware/index.js";

const router = express.Router();

// register user
router.post("/register", userCtrl.register);

// verify register
router.get("/register-verify", userCtrl.registerVerify);

// get refresh token
router.get("/refresh_token", userCtrl.refresh_token);

// add user data
router.put("/user-data", auth, userCtrl.userData);

// add user address
router.put("/user-address", auth, userCtrl.userAddress);

// login user
router.post("/login", userCtrl.login);

// login verify
router.post("/login-verify", userCtrl.loginVerify);

// logout user
router.get("/logout", userCtrl.logout);

// update user data
router.put(
  "/user-data/:id",
  auth,
  checkValidUserOrAdmin,
  userCtrl.userDataUpdate
);

// update user address
router.put(
  "/user-data/:id",
  auth,
  checkValidUserOrAdmin,
  userCtrl.userAddressUpdate
);

// delete user
router.delete(
  "/user/:id",
  auth,
  checkValidUserOrAdmin,
  checkValidUserOrAdmin,
  userCtrl.deleteUser
);

// reset password
router.post("/reset-password", auth, userCtrl.resetPassword);

// get cart
router.get("/getcart", auth, userCtrl.getCart);

// add to cart
router.patch("/addcart", auth, userCtrl.addCart);

// forgot password
router.post("/forgot-password", userCtrl.forgotPassword);

// validate confirm forgot password
router.get(
  "/validate-confirm-forgot-password",
  userCtrl.validateConfirmForgotPassword
);

// confirm forgot password
router.post("/confirm-forgot-password", userCtrl.confirmForgotPassword);

// get all users
router.get("/users", auth, authAdmin, userCtrl.getUsers);

// get user
router.get("/user/:id", auth, checkValidUserOrAdmin, userCtrl.getUser);

export default router;
