import { Response } from "express";

import { IReqAuth } from "../types";
import {
  addCartService,
  clearCartService,
  getCartService,
  removeCartService,
} from "../services/cart.service";
import {
  addCartSchema,
  removeCartSchema,
} from "../validations/cart.validation";
import { formatValidationError } from "../utils/format";
import logger from "../config/logger";

export const getCart = async (req: IReqAuth, res: Response) => {
  try {
    logger.info("Started fetching cart");

    const user = req.user?._id as string;

    const cart = await getCartService(user);

    logger.info("Successfully fetched cart");

    res.status(200).json(cart);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const addCart = async (req: IReqAuth, res: Response) => {
  try {
    logger.info("Started adding product to cart");

    const user = req.user?._id as string;

    const validationResult = addCartSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { productId, quantity } = validationResult.data;

    await addCartService({ userId: user, productId, quantity });

    logger.info(`Product ${productId} added to cart`);

    res.json({ message: "Product added to cart." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const removeCart = async (req: IReqAuth, res: Response) => {
  try {
    logger.info("Started removing product from cart");

    const validationResult = removeCartSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { productId } = validationResult.data;

    const user = req.user?._id as string;

    await removeCartService({ userId: user, productId });

    logger.info(`Product ${productId} removed from cart`);

    res.json({ message: "Product removed from cart." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const clearCart = async (req: IReqAuth, res: Response) => {
  try {
    logger.info("Started clearing cart");

    const user = req.user?._id as string;

    await clearCartService(user);

    logger.info(`Cart cleared by user ${user}`);

    res.json({ message: "Cart cleared." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
