import {Request, Response} from "express";
import cloudinary from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import {UploadedFile} from "express-fileupload";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

interface CloudinaryFile extends UploadedFile {}

const uploadCtrl = {
  uploadImage: async (req: Request, res: Response) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        res
          .status(400)
          .json({message: "No image was selected, please select a image."});
        return;
      }

      const file = req.files.file as CloudinaryFile;
      if ((file.size as any) > 2 * 1024 * 1024) {
        removeTmp(file.tempFilePath);
        res
          .status(400)
          .json({message: "Image size is too large. (required within 2mb)"});
        return;
      }

      if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
        removeTmp(file.tempFilePath);
        res
          .status(400)
          .json({message: "Image format is incorrect. (required jpeg or png)"});
        return;
      }

      cloudinary.v2.uploader.upload(
        file.tempFilePath,
        {folder: "e-commerce"},
        async (error, result) => {
          if (error) {
            res.status(400).json({message: error.message});
            return;
          }
          if (!result) {
            res.status(400).json({message: "Something went wrong!"});
            return;
          }
          removeTmp(file.tempFilePath);
          res.json({
            public_id: result.public_id,
            url: result.secure_url,
          });
          return;
        }
      );
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  uploadImages: async (req: Request, res: Response) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        res
          .status(400)
          .json({message: "No image was selected, please select a image."});
        return;
      }
      const file = req.files.file as any[];
      if (file.length > 5) {
        res
          .status(400)
          .json({message: "You can only upload 5 images at a time."});
        return;
      }
      for (const image of file) {
        if (image.size > 2 * 1024 * 1024) {
          removeTmp(image.tempFilePath);
          res
            .status(400)
            .json({message: "Image size is too large. (required within 2mb)"});
          return;
        }
        if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
          removeTmp(image.tempFilePath);
          res.status(400).json({
            message: "Image format is incorrect. (required jpeg or png)",
          });
          return;
        }
      }
      var images: any[] = [];
      for (const image of file) {
        await cloudinary.v2.uploader.upload(
          image.tempFilePath,
          {folder: "e-commerce"},
          async (error, result) => {
            if (error) {
              res.status(400).json({message: error.message});
              return;
            }
            if (!result) {
              res.status(400).json({message: "Something went wrong!"});
              return;
            }
            removeTmp(image.tempFilePath);
            images.push({public_id: result.public_id, url: result.secure_url});
          }
        );
      }
      res.json(images);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  deleteImage: async (req: Request, res: Response) => {
    try {
      const {public_id} = req.body;
      if (!public_id) {
        res.status(400).json({
          message: "No image was selected, please select a image first.",
        });
        return;
      }

      cloudinary.v2.uploader.destroy(public_id, async (error: any) => {
        if (error) throw error;
        res.json({message: "Image Deleted Successfully."});
        return;
      });
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
};

const removeTmp = (path: any) => {
  fs.unlink(path, (error: any) => {
    if (error) throw error;
  });
};

export default uploadCtrl;
