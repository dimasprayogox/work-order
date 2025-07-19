// routes/employee/workOrderRoute.js (atau routes/employee/dashboard.routes.js)
import express from "express";
import { WorkOrderController } from "../../controllers/technician/WorkOrderController.js"; // Sesuaikan path controller
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('employee')); // Hanya employee yang bisa melihat request mereka sendiri

router.get("/my-requests", WorkOrderController.getMyWorkRequests); // <<< RUTE BARU

export default router;