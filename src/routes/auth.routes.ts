import express from "express";

import {
  register,
  registerVerify,
  login,
  loginVerify,
  refresh_token,
  logout,
  forgotPassword,
  validateConfirmForgotPassword,
  confirmForgotPassword,
} from "../controllers/auth.controller";

const router = express.Router();

router.post("/register", register);

router.get("/register-verify", registerVerify);

router.post("/login", login);

router.post("/login-verify", loginVerify);

router.get("/refresh_token", refresh_token);

router.get("/logout", logout);

router.post("/forgot-password", forgotPassword);

router.get("/validate-confirm-forgot-password", validateConfirmForgotPassword);

router.post("/confirm-forgot-password", confirmForgotPassword);

export default router;
