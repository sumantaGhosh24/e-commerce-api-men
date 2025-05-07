import express from "express";

import orderCtrl from "../controllers/orderCtrl";
import auth from "../middleware/auth";
import authAdmin from "../middleware/authAdmin";

const router = express.Router();

router.post("/razorpay", auth, orderCtrl.getRazorpay);

router.post("/verification", auth, orderCtrl.verification);

router.get("/orders", authAdmin, orderCtrl.getOrders);

router.get("/order/:id", auth, orderCtrl.getOrder);

router.put("/order/:id", auth, orderCtrl.updateOrder);

router.get("/user-orders", auth, orderCtrl.getUserOrders);

export default router;
