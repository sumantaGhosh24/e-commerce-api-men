import express from "express";

import categoryCtrl from "../controllers/categoryCtrl";
import authAdmin from "../middleware/authAdmin";

const router = express.Router();

router
  .route("/category")
  .get(categoryCtrl.getCategories)
  .post(authAdmin, categoryCtrl.createCategory);

router
  .route("/category/:id")
  .get(authAdmin, categoryCtrl.getCategory)
  .put(authAdmin, categoryCtrl.updateCategory)
  .delete(authAdmin, categoryCtrl.deleteCategory);

export default router;
