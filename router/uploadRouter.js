import express from "express";

import {uploadCtrl} from "../controllers/index.js";
import {auth, authAdmin} from "../middleware/index.js";

const router = express.Router();

router.post("/upload", auth, uploadCtrl.uploadImage);

router.post("/uploads", auth, authAdmin, uploadCtrl.uploadImages);

router.post("/destroy", auth, authAdmin, uploadCtrl.deleteImage);

export default router;
