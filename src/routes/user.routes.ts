import express from "express";

import {
  userImage,
  userData,
  userAddress,
  resetPassword,
  deleteUser,
  getUsers,
} from "../controllers/user.controller";
import auth from "../middleware/auth.middleware";
import authAdmin from "../middleware/admin.middleware";

const router = express.Router();

router.put("/user-image", auth, userImage);

router.put("/user-data", auth, userData);

router.put("/user-address", auth, userAddress);

router.post("/reset-password", auth, resetPassword);

router.delete("/user/:id", authAdmin, deleteUser);

router.get("/users", authAdmin, getUsers);

export default router;
