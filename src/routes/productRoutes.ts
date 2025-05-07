import express from "express";

import productCtrl from "../controllers/productCtrl";
import authAdmin from "../middleware/authAdmin";

const router = express.Router();

router.get("/products", productCtrl.getProducts);

router.get("/product/:id", productCtrl.getProduct);

router.post("/product", authAdmin, productCtrl.createProduct);

router.put("/product/:id", authAdmin, productCtrl.updateProduct);

router.patch("/add-images/:id", authAdmin, productCtrl.addImages);

router.patch("/remove-images/:id", authAdmin, productCtrl.removeImages);

router.delete("/product/:id", authAdmin, productCtrl.deleteProduct);

export default router;
