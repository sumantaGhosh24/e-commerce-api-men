import { Request, Response } from "express";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

import {
  deleteImageService,
  uploadImageService,
  uploadImagesService,
} from "../services/upload.service";
import logger from "../config/logger";
import { deleteImageSchema } from "../validations/upload.validation";
import { formatValidationError } from "../utils/format";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const uploadImage = async (req: Request, res: Response) => {
  try {
    logger.info("Started uploading image");

    const image = await uploadImageService(req);

    logger.info(`Image ${image.public_id} uploaded successfully`);

    res.json(image);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const uploadImages = async (req: Request, res: Response) => {
  try {
    logger.info("Started uploading images");

    const images = await uploadImagesService(req);

    logger.info("Images uploaded successfully");

    res.json(images);
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    logger.info(`Image ${req.body.public_id} started deleting`);

    const validationResult = deleteImageSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { public_id } = validationResult.data;

    const { message } = await deleteImageService(public_id);

    logger.info(`Image ${public_id} deleted successfully`);

    res.json({ message });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
