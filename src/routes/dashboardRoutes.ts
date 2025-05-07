import express from "express";

import dashboardCtrl from "../controllers/dashboardCtrl";
import auth from "../middleware/auth";
import authAdmin from "../middleware/authAdmin";

const router = express.Router();

router.get("/admin/dashboard", authAdmin, dashboardCtrl.getAdminDashboard);

router.get("/dashboard", auth, dashboardCtrl.getDashboard);

export default router;
