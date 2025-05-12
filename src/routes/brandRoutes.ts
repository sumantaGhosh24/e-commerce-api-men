import express from "express";

import brandCtrl from "../controllers/brandCtrl";
import authAdmin from "../middleware/authAdmin";

const router = express.Router();

router
  .route("/brand")
  .get(brandCtrl.getBrands)
  .post(authAdmin, brandCtrl.createBrand);

router
  .route("/brand/:id")
  .get(authAdmin, brandCtrl.getBrand)
  .put(authAdmin, brandCtrl.updateBrand)
  .delete(authAdmin, brandCtrl.deleteBrand);

export default router;
