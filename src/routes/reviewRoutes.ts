import express from "express";

import reviewCtrl from "../controllers/reviewCtrl";
import auth from "../middleware/auth";
import authAdmin from "../middleware/authAdmin";

const router = express.Router();

router.get("/reviews", authAdmin, reviewCtrl.getReviews);

router.get("/review/:product", reviewCtrl.getProductReviews);

router.get("/review/user/:user", reviewCtrl.getUserReviews);

router.post("/review/:product", auth, reviewCtrl.createReview);

export default router;
