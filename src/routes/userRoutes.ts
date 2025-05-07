import express from "express";

import userCtrl from "../controllers/userCtrl";
import auth from "../middleware/auth";
import authAdmin from "../middleware/authAdmin";
import loginLimiter from "../middleware/loginLimiter";

const router = express.Router();

router.post("/register", userCtrl.register);

router.get("/register-verify", userCtrl.registerVerify);

router.post("/login", loginLimiter, userCtrl.login);

router.post("/login-verify", userCtrl.loginVerify);

router.get("/refresh_token", userCtrl.refresh_token);

router.get("/logout", userCtrl.logout);

router.post("/forgot-password", userCtrl.forgotPassword);

router.get(
  "/validate-confirm-forgot-password",
  userCtrl.validateConfirmForgotPassword
);

router.post("/confirm-forgot-password", userCtrl.confirmForgotPassword);

router.put("/user-image", auth, userCtrl.userImage);

router.put("/user-data", auth, userCtrl.userData);

router.put("/user-address", auth, userCtrl.userAddress);

router.post("/reset-password", auth, userCtrl.resetPassword);

router.delete("/user/:id", authAdmin, userCtrl.deleteUser);

router.get("/users", authAdmin, userCtrl.getUsers);

export default router;
