import express from "express";

import {
  getAdminDashboard,
  getDashboard,
} from "../controllers/dashboard.controller";
import auth from "../middleware/auth.middleware";
import authAdmin from "../middleware/admin.middleware";

const router = express.Router();

router.get("/admin/dashboard", authAdmin, getAdminDashboard);

router.get("/dashboard", auth, getDashboard);

export default router;
