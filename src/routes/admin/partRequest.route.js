// src/routes/admin/partRequest.route.js
import express from "express";
import { AdminPartRequestController } from "../../controllers/admin/partRequestController.js";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import { authorizeRole } from "../../middleware/role-middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole("admin"));

router.get("/", AdminPartRequestController.index);
router.patch("/:id/status", AdminPartRequestController.updateStatus);
router.delete("/:id", AdminPartRequestController.destroy);
router.post("/delete-many", AdminPartRequestController.deleteMany);

export default router;
