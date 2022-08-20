import express from "express";

import {uploadCtrl} from "../controllers/index.js";
import {auth, authAdmin, checkValidUserOrAdmin} from "../middleware/index.js";

const router = express.Router();

router.post("/upload", auth, uploadCtrl.uploadImage);

router.post("/uploads", authAdmin, uploadCtrl.uploadImages);

router.post("/destroy", checkValidUserOrAdmin, uploadCtrl.deleteImage);

export default router;
