import express from "express";
import { PartRequestController } from "../../controllers/technician/PartRequestController.js";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import { authorizeRole } from "../../middleware/role-middleware.js";

const router = express.Router();

// Semua endpoint memerlukan autentikasi
router.use(authMiddleware);

// Teknisi: buat Part Request untuk Work Order
router.post("/", authorizeRole("technician"), PartRequestController.create);

// Teknisi: lihat semua Part Request untuk Work Order tertentu
router.get("/:id", authorizeRole("technician"), PartRequestController.getByWorkOrder);


export default router;
