import express from "express";

import {paymentCtrl} from "../controllers/index.js";
import {auth} from "../middleware/index.js";

const router = express.Router();

router.get("/logo", paymentCtrl.logo);

router.post("/verification", paymentCtrl.verification);

router.post("/razorpay", paymentCtrl.razorPay);

export default router;
