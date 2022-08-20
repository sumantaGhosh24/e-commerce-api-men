import express from "express";

import {reviewCtrl} from "../controllers/index.js";
import {auth, checkValidUserOrAdmin} from "../middleware/index.js";

const router = express.Router();

// get product reviews
router.get("/reviews/:product", reviewCtrl.getReviews);

// get review
router.get("/review/:id", reviewCtrl.getReview);

// create review
router.post("/review/:product", auth, reviewCtrl.createReview);

// update review
router.put("/review/:id", auth, checkValidUserOrAdmin, reviewCtrl.updateReview);

// delete review
router.delete(
  "/review/:id",
  auth,
  checkValidUserOrAdmin,
  reviewCtrl.deleteReview
);

export default router;
