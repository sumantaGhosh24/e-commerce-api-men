import express from "express";

import {productCtrl} from "../controllers/index.js";
import {auth, authAdmin} from "../middleware/index.js";

const router = express.Router();

// get all products
router.get("/products", productCtrl.getProducts);

// create product
router.post("/product", auth, authAdmin, productCtrl.createProduct);

// get product & update product & delete product & add image
router
  .route("/product/:id")
  .get(productCtrl.getProduct)
  .put(auth, authAdmin, productCtrl.updateProduct)
  .delete(auth, authAdmin, productCtrl.deleteProduct)
  .patch(auth, authAdmin, productCtrl.addImage);

export default router;
