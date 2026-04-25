import express from "express";

import {
  getReviews,
  getProductReviews,
  getUserReviews,
  createReview,
} from "../controllers/review.controller";
import auth from "../middleware/auth.middleware";
import authAdmin from "../middleware/admin.middleware";

const router = express.Router();

router.get("/reviews", authAdmin, getReviews);

router.get("/review/:product", getProductReviews);

router.get("/review/user/:user", getUserReviews);

router.post("/review/:product", auth, createReview);

export default router;
