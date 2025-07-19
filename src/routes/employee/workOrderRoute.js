
import express from "express";
import { WorkOrderController } from "../../controllers/technician/WorkOrderController.js"; 
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('employee')); 

router.get("/my-requests", WorkOrderController.getMyWorkRequests);

export default router;