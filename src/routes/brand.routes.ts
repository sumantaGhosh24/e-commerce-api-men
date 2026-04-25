import express from "express";

import {
  createBrand,
  getBrand,
  getBrands,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller";
import authAdmin from "../middleware/admin.middleware";

const router = express.Router();

router.route("/brand").get(getBrands).post(authAdmin, createBrand);

router
  .route("/brand/:id")
  .get(authAdmin, getBrand)
  .put(authAdmin, updateBrand)
  .delete(authAdmin, deleteBrand);

export default router;
