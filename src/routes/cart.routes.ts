import express from "express";

import {
  getCart,
  addCart,
  removeCart,
  clearCart,
} from "../controllers/cart.controller";
import auth from "../middleware/auth.middleware";

const router = express.Router();

router.get("/cart", auth, getCart);

router.post("/cart/add", auth, addCart);

router.post("/cart/remove", auth, removeCart);

router.post("/cart/clear", auth, clearCart);

export default router;
