import { Request, Response } from "express";

import {
  createReviewService,
  getProductReviewsService,
  getReviewsService,
  getUserReviewsService,
} from "../services/review.service";
import { IReqAuth } from "../types";
import {
  createReviewSchema,
  reviewProductSchema,
  reviewUserSchema,
} from "../validations/review.validation";
import { formatValidationError } from "../utils/format";
import logger from "../config/logger";

export const getReviews = async (req: Request, res: Response) => {
  try {
    logger.info("Started fetching reviews");

    const { reviews, count } = await getReviewsService(req.query);

    logger.info("Successfully fetched reviews");

    res.status(200).json({ reviews, count });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    logger.info(`Started fetching reviews of product ${req.params.product}`);

    const validationParams = reviewProductSchema.safeParse({
      product: req.params.product,
    });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { product } = validationParams.data;

    const reviews = await getProductReviewsService(product);

    logger.info(`Product ${product} reviews retrieved successfully`);

    res.status(200).json(reviews);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getUserReviews = async (req: Request, res: Response) => {
  try {
    logger.info(`Started fetching reviews of user ${req.params.user}`);

    const validationParams = reviewUserSchema.safeParse({
      user: req.params.user,
    });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { user } = validationParams.data;

    const reviews = await getUserReviewsService(user);

    logger.info(`User ${user} reviews retrieved successfully`);

    res.status(200).json(reviews);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createReview = async (req: IReqAuth, res: Response) => {
  try {
    logger.info(`Started creating review of product ${req.body.product}`);

    const validationResult = createReviewSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { product, comment, rating } = validationResult.data;

    const newReview = await createReviewService(
      product,
      req.user?._id as string,
      comment,
      rating
    );

    logger.info(`Review ${newReview.comment} created successfully`);

    res.json({ message: "Review Created successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
