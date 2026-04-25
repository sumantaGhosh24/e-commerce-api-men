import express from "express";

import {
  getRazorpay,
  verification,
  getOrders,
  getOrder,
  updateOrder,
  getUserOrders,
} from "../controllers/order.controller";
import auth from "../middleware/auth.middleware";
import authAdmin from "../middleware/admin.middleware";

const router = express.Router();

router.post("/razorpay", auth, getRazorpay);

router.post("/verification", auth, verification);

router.get("/orders", authAdmin, getOrders);

router.get("/order/:id", auth, getOrder);

router.put("/order/:id", auth, updateOrder);

router.get("/user-orders", auth, getUserOrders);

export default router;
