import express from "express";

import uploadCtrl from "../controllers/uploadCtrl";
import auth from "../middleware/auth";
import authAdmin from "../middleware/authAdmin";

const router = express.Router();

router.post("/upload", auth, uploadCtrl.uploadImage);

router.post("/uploads", authAdmin, uploadCtrl.uploadImages);

router.post("/destroy", auth, uploadCtrl.deleteImage);

export default router;
