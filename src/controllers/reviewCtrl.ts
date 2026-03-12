import {Request, Response} from "express";

import Review from "../models/reviewModel";
import {APIFeatures} from "../lib";
import {IReqAuth} from "../types";
import redisClient from "../lib/redis";
import {CACHE_KEYS} from "../lib/cacheKeys";

const CACHE_TTL = 60 * 10;

const reviewCtrl = {
  getReviews: async (req: Request, res: Response) => {
    try {
      const queryKey = JSON.stringify(req.query);
      const cacheKey = CACHE_KEYS.REVIEWS(queryKey);

      const cached = await redisClient.get(cacheKey);

      if (cached) {
        res.status(200).json(JSON.parse(cached));
        return;
      }

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

      await redisClient.setEx(
        cacheKey,
        CACHE_TTL,
        JSON.stringify({reviews, count})
      );

      res.status(200).json({reviews, count});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  getProductReviews: async (req: Request, res: Response) => {
    try {
      const cacheKey = CACHE_KEYS.PRODUCT_REVIEWS(req.params.product);

      const cached = await redisClient.get(cacheKey);

      if (cached) {
        res.status(200).json(JSON.parse(cached));
        return;
      }

      const reviews = await Review.findById(req.params.product)
        .populate("product", "_id title description images")
        .populate("user", "_id username email mobileNumber image");
      if (!reviews) {
        res.status(404).json({message: "Review not found."});
        return;
      }

      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(reviews));

      res.status(200).json(reviews);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  getUserReviews: async (req: Request, res: Response) => {
    try {
      const cacheKey = CACHE_KEYS.USER_REVIEWS(req.params.user);

      const cached = await redisClient.get(cacheKey);

      if (cached) {
        res.status(200).json(JSON.parse(cached));
        return;
      }

      const reviews = await Review.find({user: req.params.user})
        .populate("product", "_id title description images")
        .populate("user", "_id username email mobileNumber image");
      if (!reviews) {
        res.status(404).json({message: "Review not found."});
        return;
      }

      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(reviews));

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

      await redisClient.del(CACHE_KEYS.PRODUCT_REVIEWS(product));

      const keys = await redisClient.keys("reviews:*");
      if (keys.length) await redisClient.del(keys);

      res.json({message: "Review Created successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
};

export default reviewCtrl;
