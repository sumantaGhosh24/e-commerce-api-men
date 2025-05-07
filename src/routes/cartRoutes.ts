import express from "express";

import cartCtrl from "../controllers/cartCtrl";
import auth from "../middleware/auth";

const router = express.Router();

router.get("/cart", auth, cartCtrl.getCart);

router.post("/cart/add", auth, cartCtrl.addCart);

router.post("/cart/remove", auth, cartCtrl.removeCart);

router.post("/cart/clear", auth, cartCtrl.clearCart);

export default router;
