// src/routes/technician/workOrderRoute.js
import express from 'express';
// --- PERBAIKAN KRITIS DI SINI ---
// Anda harus mengimpor 'WorkOrderController', BUKAN 'TechnicianController'
import { WorkOrderController } from '../../controllers/technician/workOrderController.js'; // <-- HARUS SAMA DENGAN NAMA EKSPOR
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('technician')); // Ini rute untuk teknisi

router.get("/", WorkOrderController.getMyWorkOrders); // Contoh: Ambil WO yang di-assign
router.patch("/:id", WorkOrderController.updateWorkOrder); // Menggunakan PATCH untuk update

// Jika Anda juga mendaftarkan /my-requests di sini, pastikan autorisasinya sesuai.
// router.get("/my-requests", WorkOrderController.getMyWorkRequests);

export default router;