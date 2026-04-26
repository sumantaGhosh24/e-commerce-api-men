import { Request, Response } from "express";

import {
  createCategoryService,
  deleteCategoryService,
  getCategoriesService,
  getCategoryService,
  updateCategoryService,
} from "../services/category.service";
import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation";
import { formatValidationError } from "../utils/format";
import logger from "../config/logger";

export const getCategories = async (req: Request, res: Response) => {
  try {
    logger.info("Started fetching categories");

    const categories = await getCategoriesService();

    logger.info("Successfully fetched categories");

    res.json(categories);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    logger.info(`Category ${req.body.name} started creating`);

    const validationResult = createCategorySchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { name, image, parentId } = validationResult.data;

    await createCategoryService({ name, image, parentId });

    logger.info(`Category ${name} created successfully`);

    res.json({ message: "Category created successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getCategory = async (req: Request, res: Response) => {
  try {
    logger.info(`Category ${req.params.id} started fetching`);

    const validationResult = categoryIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    const category = await getCategoryService(id);

    logger.info(`Category ${id} retrieved successfully`);

    res.json(category);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    logger.info(`Category ${req.params.id} started updating`);

    const validationParams = categoryIdSchema.safeParse({ id: req.params.id });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { id } = validationParams.data;

    const validationResult = updateCategorySchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { name, image, parentId } = validationResult.data;

    await updateCategoryService(id, {
      name,
      image,
      parentId,
    });

    logger.info(`Category ${id} updated successfully`);

    res.json({ message: "Category updated successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    logger.info(`Category ${req.params.id} started deleting`);

    const validationParams = categoryIdSchema.safeParse({ id: req.params.id });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { id } = validationParams.data;

    await deleteCategoryService(id);

    logger.info(`Category ${id} deleted successfully`);

    res.json({ message: "Category Deleted." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
