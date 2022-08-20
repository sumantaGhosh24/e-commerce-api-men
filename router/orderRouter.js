import express from "express";

import {orderCtrl} from "../controllers/index.js";
import {auth, checkValidUserOrAdmin} from "../middleware/index.js";

const router = express.Router();

// get orders
router.get("/orders", auth, checkValidUserOrAdmin, orderCtrl.getOrders);

// create order
router.post("/order", auth, orderCtrl.createOrder);

// get order & update order & delete order
router
  .route("/order/:id")
  .get(auth, checkValidUserOrAdmin, orderCtrl.getOrder)
  .put(auth, checkValidUserOrAdmin, orderCtrl.updateOrder)
  .delete(auth, checkValidUserOrAdmin, orderCtrl.deleteOrder);

// get user order
router.get("/order", auth, checkValidUserOrAdmin, orderCtrl.getUserOrder);

export default router;
