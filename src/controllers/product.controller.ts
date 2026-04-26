import { Request, Response } from "express";

import {
  addImagesService,
  createProductService,
  deleteProductService,
  getProductService,
  getProductsService,
  removeImagesService,
  updateProductService,
} from "../services/product.service";
import { IReqAuth } from "../types";
import {
  addProductImageSchema,
  createProductSchema,
  productIdSchema,
  removeProductImageSchema,
  updateProductSchema,
} from "../validations/product.validation";
import { formatValidationError } from "../utils/format";
import logger from "../config/logger";

export const getProducts = async (req: IReqAuth, res: Response) => {
  try {
    logger.info("Started fetching products");

    const { products, count } = await getProductsService(req.query);

    logger.info("Successfully fetched products");

    res.status(200).json({ products, count });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getProduct = async (req: IReqAuth, res: Response) => {
  try {
    logger.info(`Started fetching product ${req.params.id}`);

    const validationResult = productIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    const product = await getProductService(id);

    logger.info(`Product ${id} retrieved successfully`);

    res.status(200).json(product);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createProduct = async (req: IReqAuth, res: Response) => {
  try {
    logger.info("Started creating product");

    const validationResult = createProductSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const {
      title,
      description,
      content,
      category,
      brand,
      price,
      checked,
      stock,
      sold,
      images,
    } = validationResult.data;

    const owner = req.user?._id as string;

    const newProduct = await createProductService(
      {
        title: title.toLowerCase(),
        description: description.toLowerCase(),
        content,
        category,
        brand,
        price,
        checked,
        stock,
        sold,
        images,
      },
      owner
    );

    logger.info(`Product ${newProduct.title} created successfully`);

    res.json({ message: "Product created successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    logger.info(`Started updating product ${req.params.id}`);

    const validationParams = productIdSchema.safeParse({ id: req.params.id });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { id } = validationParams.data;

    const validationResult = updateProductSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const {
      title,
      description,
      content,
      category,
      brand,
      price,
      checked,
      stock,
      sold,
    } = validationResult.data;

    await updateProductService(id, {
      title,
      description,
      content,
      category,
      brand,
      price,
      checked,
      stock,
      sold,
    });

    logger.info(`Product ${id} updated successfully`);

    res.json({ message: "Product updated successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const addImages = async (req: Request, res: Response) => {
  try {
    logger.info(`Started adding images to product ${req.params.id}`);

    const validationParams = productIdSchema.safeParse({ id: req.params.id });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { id } = validationParams.data;

    const validationResult = addProductImageSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { images } = validationResult.data;

    await addImagesService(id, images);

    logger.info(`Images added to product ${id}`);

    res.json({ message: "Image added successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const removeImages = async (req: Request, res: Response) => {
  try {
    logger.info(`Started removing images from product ${req.params.id}`);

    const validationParams = productIdSchema.safeParse({ id: req.params.id });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { id } = validationParams.data;

    const validationResult = removeProductImageSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { public_id } = validationResult.data;

    await removeImagesService(id, public_id);

    logger.info(`Images removed from product ${id}`);

    res.json({ message: "Image removed successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    logger.info(`Started deleting product ${req.params.id}`);

    const validationParams = productIdSchema.safeParse({ id: req.params.id });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { id } = validationParams.data;

    await deleteProductService(id);

    logger.info(`Product ${id} deleted successfully`);

    res.json({ message: "Product deleted successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
