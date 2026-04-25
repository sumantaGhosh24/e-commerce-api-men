import express from "express";

import {
  uploadImage,
  uploadImages,
  deleteImage,
} from "../controllers/upload.controller";
import auth from "../middleware/auth.middleware";
import authAdmin from "../middleware/admin.middleware";

const router = express.Router();

router.post("/upload", auth, uploadImage);

router.post("/uploads", authAdmin, uploadImages);

router.post("/destroy", auth, deleteImage);

export default router;
