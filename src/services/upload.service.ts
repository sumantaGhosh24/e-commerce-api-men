import { Request } from "express";
import cloudinary from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { UploadedFile } from "express-fileupload";

import logger from "../config/logger";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

type CloudinaryFile = UploadedFile;

export const removeTmp = (path: string) => {
  fs.unlink(path, (error: unknown) => {
    if (error) throw error;
  });
};

export const uploadImageService = async (req: Request) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      throw {
        status: 400,
        message: "No image was selected, please select a image.",
      };
    }
    const file = req.files.file as CloudinaryFile;
    if (file.size > 2 * 1024 * 1024) {
      removeTmp(file.tempFilePath);
      throw {
        status: 400,
        message: "Image size is too large. (required within 2mb)",
      };
    }
    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
      removeTmp(file.tempFilePath);
      throw {
        status: 400,
        message: "Image format is incorrect. (required jpeg or png)",
      };
    }

    return new Promise<{ public_id: string; url: string }>(
      (resolve, reject) => {
        cloudinary.v2.uploader.upload(
          file.tempFilePath,
          { folder: "e-commerce" },
          (error, result) => {
            removeTmp(file.tempFilePath);
            if (error) return reject({ status: 400, message: error.message });
            if (!result)
              return reject({ status: 400, message: "Something went wrong!" });
            resolve({
              public_id: result.public_id,
              url: result.secure_url,
            });
          }
        );
      }
    );
  } catch (error) {
    logger.error("Error to upload image", error);

    throw error;
  }
};

export const uploadImagesService = async (req: Request) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      throw {
        status: 400,
        message: "No image was selected, please select a image.",
      };
    }
    const files = req.files.file as CloudinaryFile[];
    if (files.length > 5) {
      throw { status: 400, message: "You can only upload 5 images at a time." };
    }
    for (const image of files) {
      if (image.size > 2 * 1024 * 1024) {
        removeTmp(image.tempFilePath);
        throw {
          status: 400,
          message: "Image size is too large. (required within 2mb)",
        };
      }
      if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
        removeTmp(image.tempFilePath);
        throw {
          status: 400,
          message: "Image format is incorrect. (required jpeg or png)",
        };
      }
    }

    const uploadPromises = files.map(
      image =>
        new Promise<{ public_id: string; url: string }>((resolve, reject) => {
          cloudinary.v2.uploader.upload(
            image.tempFilePath,
            { folder: "e-commerce" },
            (error, result) => {
              removeTmp(image.tempFilePath);
              if (error) return reject({ status: 400, message: error.message });
              if (!result)
                return reject({
                  status: 400,
                  message: "Something went wrong!",
                });
              resolve({
                public_id: result.public_id,
                url: result.secure_url,
              });
            }
          );
        })
    );

    return Promise.all(uploadPromises);
  } catch (error) {
    logger.error("Error to upload images", error);

    throw error;
  }
};

export const deleteImageService = async (public_id: string) => {
  try {
    return new Promise<{ message: string }>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cloudinary.v2.uploader.destroy(public_id, (error: any) => {
        if (error) return reject({ status: 500, message: error.message });
        resolve({ message: "Image Deleted Successfully." });
      });
    });
  } catch (error) {
    logger.error("Error to delete image", error);

    throw error;
  }
};
