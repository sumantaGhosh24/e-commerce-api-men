import { Request, Response } from "express";

import logger from "../config/logger";
import {
  createBrandService,
  deleteBrandService,
  getBrandService,
  getBrandsService,
  updateBrandService,
} from "../services/brand.service";
import {
  brandIdSchema,
  createBrandSchema,
  updateBrandSchema,
} from "../validations/brand.validation";
import { formatValidationError } from "../utils/format";

export const getBrands = async (req: Request, res: Response) => {
  try {
    const brands = await getBrandsService();

    logger.info("Successfully fetched brands");

    res.json(brands);
    return;
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const createBrand = async (req: Request, res: Response) => {
  try {
    const validationResult = createBrandSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { name, image } = validationResult.data;

    await createBrandService(name, image);

    logger.info(`Brand ${name} created successfully`);

    res.json({ message: "Brand created successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getBrand = async (req: Request, res: Response) => {
  try {
    const validationResult = brandIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    const brand = await getBrandService(id);

    logger.info(`Brand ${id} retrieved successfully`);

    res.json(brand);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const updateBrand = async (req: Request, res: Response) => {
  try {
    const validationParams = brandIdSchema.safeParse({ id: req.params.id });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { id } = validationParams.data;

    const validationResult = updateBrandSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { name, image } = validationResult.data;

    await updateBrandService(id, name, image);

    logger.info(`Brand ${id} updated successfully`);

    res.json({ message: "Brand updated successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const validationResult = brandIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    await deleteBrandService(id);

    logger.info(`Brand ${id} deleted successfully`);

    res.json({ message: "Brand deleted successfully." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
