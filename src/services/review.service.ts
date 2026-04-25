import Review, { IReview } from "../models/review.model";
import { APIFeatures } from "../utils/pagination";
import redisClient from "../config/redis";
import { CACHE_KEYS } from "../config/cacheKeys";
import logger from "../config/logger";

const CACHE_TTL = 60 * 10;

export const getReviewsService = async (
  query: Record<string, unknown>
): Promise<{ reviews: IReview[]; count: number }> => {
  try {
    const queryKey = JSON.stringify(query);
    const cacheKey = CACHE_KEYS.REVIEWS(queryKey);

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const features = new APIFeatures(
      Review.find()
        .populate("product", "_id title description images")
        .populate("user", "_id username email mobileNumber image"),
      query
    )
      .paginating()
      .sorting()
      .searching()
      .filtering();
    const features2 = new APIFeatures(Review.find(), query)
      .searching()
      .filtering();

    const result = await Promise.allSettled([features.query, features2.query]);

    const reviews = result[0].status === "fulfilled" ? result[0].value : [];
    const count = result[1].status === "fulfilled" ? result[1].value.length : 0;

    await redisClient.setEx(
      cacheKey,
      CACHE_TTL,
      JSON.stringify({ reviews, count })
    );

    return { reviews, count };
  } catch (error: unknown) {
    logger.error("Error to get reviews", error);

    throw error;
  }
};

export const getProductReviewsService = async (productId: string) => {
  try {
    const cacheKey = CACHE_KEYS.PRODUCT_REVIEWS(productId);

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return cached;
    }

    const reviews = await Review.findById(productId)
      .populate("product", "_id title description images")
      .populate("user", "_id username email mobileNumber image");

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(reviews));

    return reviews;
  } catch (error: unknown) {
    logger.error("Error to get product reviews", error);

    throw error;
  }
};

export const getUserReviewsService = async (userId: string) => {
  try {
    const cacheKey = CACHE_KEYS.USER_REVIEWS(userId);

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return cached;
    }

    const reviews = await Review.find({ user: userId })
      .populate("product", "_id title description images")
      .populate("user", "_id username email mobileNumber image");

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(reviews));

    return reviews;
  } catch (error: unknown) {
    logger.error("Error to get reviews", error);

    throw error;
  }
};

export const createReviewService = async (
  product: string,
  userId: string,
  comment: string,
  rating: number
) => {
  try {
    const newReview = new Review({
      product,
      user: userId,
      comment,
      rating,
    });
    await newReview.save();

    await redisClient.del(CACHE_KEYS.PRODUCT_REVIEWS(product));

    const keys = await redisClient.keys("reviews:*");
    if (keys.length) await redisClient.del(keys);

    return newReview;
  } catch (error: unknown) {
    logger.error("Error to create review", error);

    throw error;
  }
};
