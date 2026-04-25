import express from "express";

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  addImages,
  removeImages,
  deleteProduct,
} from "../controllers/product.controller";
import authAdmin from "../middleware/admin.middleware";

const router = express.Router();

router.get("/products", getProducts);

router.get("/product/:id", getProduct);

router.post("/product", authAdmin, createProduct);

router.put("/product/:id", authAdmin, updateProduct);

router.patch("/add-images/:id", authAdmin, addImages);

router.patch("/remove-images/:id", authAdmin, removeImages);

router.delete("/product/:id", authAdmin, deleteProduct);

export default router;
