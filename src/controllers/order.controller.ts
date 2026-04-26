import { Request, Response } from "express";

import {
  getOrderService,
  getOrdersService,
  getRazorpayService,
  getUserOrdersService,
  updateOrderService,
  verifyAndCreateOrderService,
} from "../services/order.service";
import { IReqAuth } from "../types";
import {
  orderIdSchema,
  orderVerificationSchema,
  updateOrderSchema,
} from "../validations/order.validation";
import { formatValidationError } from "../utils/format";
import logger from "../config/logger";

export const getRazorpay = async (req: Request, res: Response) => {
  try {
    logger.info("Started fetching razorpay order");

    const order = await getRazorpayService(req.body.amount);

    logger.info("Successfully fetched razorpay order");

    res.json(order);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const verification = async (req: IReqAuth, res: Response) => {
  try {
    logger.info("Started verifying order");

    const validationResult = orderVerificationSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      orderItems,
      shippingAddress,
      price,
      taxPrice,
      shippingPrice,
      totalPrice,
      cartId,
    } = validationResult.data;

    const user = req?.user?._id;

    const { orderId, paymentId } = await verifyAndCreateOrderService({
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      orderItems,
      shippingAddress,
      price,
      taxPrice,
      shippingPrice,
      totalPrice,
      cartId,
      userId: user as string,
    });

    logger.info(`Order ${orderId} created successfully`);

    res.json({
      message: "success",
      orderId,
      paymentId,
    });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    logger.info("Started fetching orders");

    const { orders, count } = await getOrdersService(req.query);

    logger.info("Successfully fetched orders");

    res.status(200).json({ orders, count });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    logger.info(`Started fetching order ${req.params.id}`);

    const validationResult = orderIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    const order = await getOrderService(id);

    logger.info(`Order ${id} retrieved successfully`);

    res.json(order);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    logger.info(`Started updating order ${req.params.id}`);

    const validationParams = orderIdSchema.safeParse({ id: req.params.id });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { id } = validationParams.data;

    const validationResult = updateOrderSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { status, isDeliverd, deliverAt } = validationResult.data;

    await updateOrderService(id, {
      status,
      isDeliverd,
      deliverAt,
    });

    logger.info(`Order ${id} updated successfully`);

    res.json({ message: "Order updated successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getUserOrders = async (req: IReqAuth, res: Response) => {
  try {
    logger.info("Started fetching user orders");

    const userId = req.user?._id as string;

    const { orders, count } = await getUserOrdersService(userId, req.query);

    logger.info(`User ${userId} orders retrieved successfully`);

    res.status(200).json({ orders, count });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
