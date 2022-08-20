import cloudinary from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadCtrl = {
  uploadImage: (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0)
        return res
          .status(400)
          .json({msg: "No image was selected, please select a image."});
      const file = req.files.file;
      if (file.size > 2 * 1024 * 1024) {
        removeTmp(file.tempFilePath);
        return res
          .status(400)
          .json({msg: "Image size is too large. (required within 2mb)"});
      }
      if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
        removeTmp(file.tempFilePath);
        return res
          .status(400)
          .json({msg: "Image format is incorrect. (required jpeg or png)"});
      }
      cloudinary.v2.uploader.upload(
        file.tempFilePath,
        {folder: "e-commerce-clone-backend-men"},
        async (error, result) => {
          if (error) throw error;
          removeTmp(file.tempFilePath);
          res.json({public_id: result.public_id, url: result.secure_url});
        }
      );
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
  uploadImages: (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0)
        return res
          .status(400)
          .json({msg: "No image was selected, please select a image."});
      const images = [];
      req.files.image = !req.files.image.length
        ? [req.files.image]
        : req.files.image;
      for (let i = 0; i < req.files.image.length; i++) {
        const image = req.files.image[i];
        if (image.size > 2 * 1024 * 1024) {
          removeTmp(image.tempFilePath);
          return res
            .status(400)
            .json({msg: "Image size is too large. (required within 2mb)"});
        }
        if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
          removeTmp(image.tempFilePath);
          return res
            .status(400)
            .json({msg: "Image format is incorrect. (required jpeg or png)"});
        }
        cloudinary.v2.uploader.upload(
          image.tempFilePath,
          {folder: "e-commerce-clone-backend-men"},
          async (error, result) => {
            if (error) throw error;
            removeTmp(image.tempFilePath);
            images.push({public_id: result.public_id, url: result.secure_url});
          }
        );
      }
      res.json(images);
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
  deleteImage: (req, res) => {
    try {
      const {public_id} = req.body;
      if (!public_id)
        return res
          .status(400)
          .json({msg: "No image was selected, please select a image first."});
      cloudinary.v2.uploader.destroy(public_id, async (error, result) => {
        if (error) throw error;
        res.json({msg: "Image Deleted Successfully."});
      });
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
};

const removeTmp = (path) => {
  fs.unlink(path, (error) => {
    if (error) throw error;
  });
};

export default uploadCtrl;
