import express from "express";

import {
  getCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import authAdmin from "../middleware/admin.middleware";

const router = express.Router();

router.route("/category").get(getCategories).post(authAdmin, createCategory);

router
  .route("/category/:id")
  .get(authAdmin, getCategory)
  .put(authAdmin, updateCategory)
  .delete(authAdmin, deleteCategory);

export default router;
