import express from "express";

import {brandCtrl} from "../controllers/index.js";
import {auth, authAdmin} from "../middleware/index.js";

const router = express.Router();

// get brands & create brand
router
  .route("/brand")
  .get(brandCtrl.getBrands)
  .post(auth, authAdmin, brandCtrl.createBrand);

// update brand & delete brand
router
  .route("/brand/:id")
  .delete(auth, authAdmin, brandCtrl.deleteBrand)
  .put(auth, authAdmin, brandCtrl.updateBrand);

export default router;
