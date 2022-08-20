import express from "express";

import {paymentCtrl} from "../controllers/index.js";
import {auth, authAdmin} from "../middleware/index.js";

const router = express.Router();

router.get("/test", paymentCtrl.test);

export default router;
