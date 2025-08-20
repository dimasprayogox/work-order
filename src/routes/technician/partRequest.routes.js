import express from "express";
import { PartRequestController } from "../../controllers/technician/PartRequestController.js";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import { authorizeRole } from "../../middleware/role-middleware.js";

const router = express.Router();

// Semua endpoint memerlukan autentikasi
router.use(authMiddleware);
router.use(authorizeRole("technician"));

// Teknisi: buat Part Request untuk Work Order
router.post("/", PartRequestController.create);
// Ambil semua Part Request milik teknisi yang login
router.get("/", PartRequestController.getMyPartRequests);
// teknisi get semua part
router.get("/part", PartRequestController.getAllParts);
// teknisi delete many selected part requests 
router.post("/deletemany", authMiddleware, PartRequestController.deleteMany);
// Teknisi: lihat semua Part Request untuk Work Order tertentu
router.get("/:workOrderId", PartRequestController.getByWorkOrder);
// Teknisi: delete Part Request jika status masih pending
router.delete("/:id", PartRequestController.delete);
export default router;
