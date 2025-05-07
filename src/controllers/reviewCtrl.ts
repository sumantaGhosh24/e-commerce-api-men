import {Request, Response} from "express";

import Review from "../models/reviewModel";
import {APIFeatures} from "../lib";
import {IReqAuth} from "../types";

const reviewCtrl = {
  getReviews: async (req: Request, res: Response) => {
    try {
      const features = new APIFeatures(
        Review.find()
          .populate("product", "_id title description images")
          .populate("user", "_id username email mobileNumber image"),
        req.query
      )
        .paginating()
        .sorting()
        .searching()
        .filtering();
      const features2 = new APIFeatures(Review.find(), req.query)
        .searching()
        .filtering();

      const result = await Promise.allSettled([
        features.query,
        features2.query,
      ]);

      const reviews = result[0].status === "fulfilled" ? result[0].value : [];
      const count =
        result[1].status === "fulfilled" ? result[1].value.length : 0;

      res.status(200).json({reviews, count});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  getProductReviews: async (req: Request, res: Response) => {
    try {
      const reviews = await Review.findById(req.params.product)
        .populate("product", "_id title description images")
        .populate("user", "_id username email mobileNumber image");
      if (!reviews) {
        res.status(404).json({message: "Review not found."});
        return;
      }

      res.status(200).json(reviews);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  getUserReviews: async (req: Request, res: Response) => {
    try {
      const reviews = await Review.find({user: req.params.user})
        .populate("product", "_id title description images")
        .populate("user", "_id username email mobileNumber image");
      if (!reviews) {
        res.status(404).json({message: "Review not found."});
        return;
      }

      res.status(200).json(reviews);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  createReview: async (req: IReqAuth, res: Response) => {
    try {
      const {product, comment, rating} = req.body;

      if (!product || !comment || !rating) {
        res.status(400).json({message: "Please fill all fields."});
        return;
      }

      const newReview = new Review({
        product,
        user: req.user?._id as any,
        comment,
        rating,
      });
      await newReview.save();

      res.json({message: "Review Created successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
};

export default reviewCtrl;
